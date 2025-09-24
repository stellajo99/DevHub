pipeline {
  agent any

  environment {
    NODE_VERSION      = '18'
    DOCKER_IMAGE      = 'devhub'
    SONAR_PROJECT_KEY = 'stellajo99_DevHub'
    SONAR_ORG         = 'stellajo99'
    BUILD_TIMESTAMP   = "${new Date().format('yyyy-MM-dd-HH-mm-ss')}"
    BUILD_VERSION     = "${env.BUILD_NUMBER}-${new Date().format('yyyy-MM-dd-HH-mm-ss')}"
  }

  stages {

    stage('Build') {
      steps {
        script {
          echo "🔨 === BUILD STAGE ==="
          sh '''#!/usr/bin/env bash
            set -euo pipefail

            echo "📦 Installing root dependencies (npm ci)"
            npm ci

            echo "🎨 Building frontend"
            pushd frontend >/dev/null
              npm ci
              NODE_ENV=production npm run build
            popd >/dev/null

            echo "⚡ Preparing backend"
            pushd backend >/dev/null
              npm ci
              # If you later add Babel/tsc, keep this. For now it's a no-op build.
              npm run build || echo "No backend transpile step (expected)"
            popd >/dev/null

            echo "🐳 Building Docker image"
            docker build \
              -f Dockerfile.production \
              --build-arg BUILD_VERSION=${BUILD_VERSION} \
              --build-arg BUILD_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
              -t ${DOCKER_IMAGE}:${BUILD_VERSION} \
              -t ${DOCKER_IMAGE}:latest .

            echo "💾 Saving Docker image as artifact tar.gz"
            docker save ${DOCKER_IMAGE}:${BUILD_VERSION} | gzip > devhub-image-${BUILD_VERSION}.tar.gz
          '''
        }
      }
      post {
        success {
          script {
            // Frontend artifacts
            if (fileExists('frontend/build')) {
              archiveArtifacts artifacts: 'frontend/build/**/*', fingerprint: true, onlyIfSuccessful: true
            } else {
              echo 'frontend/build not found (skipping archive)'
            }

            // Backend dist (optional — only if it exists)
            if (fileExists('backend/dist')) {
              archiveArtifacts artifacts: 'backend/dist/**/*', fingerprint: true, onlyIfSuccessful: true
            } else {
              echo 'backend/dist not found (expected for JS runtime — skipping archive)'
            }

            // Docker image tarball
            if (fileExists("devhub-image-${BUILD_VERSION}.tar.gz")) {
              archiveArtifacts artifacts: "devhub-image-${BUILD_VERSION}.tar.gz", fingerprint: true, onlyIfSuccessful: true
            }
          }
        }
        always {
          echo '🧹 Cleaning dangling images'
          sh 'docker image prune -f || true'
        }
      }
    } 

    stage('Test') {
        environment {
            BE_JUNIT     = 'backend/junit.xml'
            BE_LCOV      = 'backend/coverage/lcov.info'
            BE_COBERTURA = 'backend/coverage/cobertura-coverage.xml'
        }
        steps {
            script { echo "🧪 === TEST STAGE ===" }

            catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
            sh """#!/usr/bin/env bash
                set -euo pipefail

                echo "▶ Start MongoDB on a RANDOM host port"
                docker rm -f ci-mongo >/dev/null 2>&1 || true
                docker run -d --name ci-mongo -P mongo:6 >/dev/null

                # Read mapped host port for 27017/tcp
                MONGO_PORT=\$(docker inspect -f '{{(index (index .NetworkSettings.Ports "27017/tcp") 0).HostPort}}' ci-mongo)
                echo "Mongo is published on host port: \$MONGO_PORT"

                echo "▶ Install backend deps"
                pushd backend >/dev/null
                npm ci
                npm i --no-save jest-junit
                popd >/dev/null

                echo "▶ Start backend server in background (PORT=5000)"
                export JWT_SECRET="ci-secret"
                export NODE_ENV="test"
                export PORT=5000
                export MONGODB_URI="mongodb://127.0.0.1:\${MONGO_PORT}/devhub_ci"

                node backend/src/server.js > backend/test-server.log 2>&1 & echo \$! > backend/test-server.pid

                echo "▶ Wait for health endpoint and database connection"
                for i in {1..40}; do
                  if curl -sf http://127.0.0.1:5000/api/health | grep -q '"status":"OK"'; then
                    echo "✅ Server and database are ready"
                    break
                  else
                    echo "⏳ Waiting for server/database... (attempt \$i/40)"
                    sleep 2
                  fi
                done

                echo "▶ Run Jest (unit + integration) with JUnit + coverage"
                pushd backend >/dev/null
                JEST_JUNIT_OUTPUT="junit.xml" \
                npx jest tests --runInBand \
                    --reporters=default --reporters=jest-junit \
                    --coverage || true
                popd >/dev/null
            """
            }
        }
        post {
            always {
            script {
                sh """#!/usr/bin/env bash
                set -e
                # Stop background server + remove mongo
                if [ -f backend/test-server.pid ]; then kill \$(cat backend/test-server.pid) || true; fi
                docker rm -f ci-mongo >/dev/null 2>&1 || true
                """
                if (fileExists(env.BE_JUNIT)) {
                junit allowEmptyResults: true, testResults: env.BE_JUNIT
                } else {
                echo "JUnit not found at ${env.BE_JUNIT}"
                }
                if (fileExists(env.BE_COBERTURA)) {
                step([$class: 'CoberturaPublisher',
                    coberturaReportFile: env.BE_COBERTURA,
                    onlyStable: false, failNoReports: false,
                    autoUpdateHealth: false, autoUpdateStability: false])
                } else {
                echo "Cobertura not found at ${env.BE_COBERTURA} (ok)"
                }
            }
            archiveArtifacts artifacts: 'backend/coverage/**/*', allowEmptyArchive: true
            }
        }
    }



    stage('Code Quality') {
      environment {
        SONAR_TOKEN = credentials('SONAR_TOKEN')
      }
      steps {
        script {
          echo "🧩 === SONARCLOUD ==="
        }
        dir('backend') {
          sh """#!/usr/bin/env bash
            set -euo pipefail

            echo "Installing SonarScanner (npx)"
            # Using npx avoids global install; requires Java which Jenkins has
            [ -f coverage/lcov.info ] || touch coverage/lcov.info

            echo "Running sonar-scanner"
            npx sonar-scanner \
              -Dsonar.projectKey='${SONAR_PROJECT_KEY}' \
              -Dsonar.organization='${SONAR_ORG}' \
              -Dsonar.sources=src \
              -Dsonar.host.url=https://sonarcloud.io \
              -Dsonar.token=$SONAR_TOKEN \
              -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info || echo "Sonar finished with issues"
          """
        }
      }
    }

    stage('Security') {
      environment {
        SNYK_TOKEN = credentials('SNYK_TOKEN')
      }
      steps {
        script {
          echo "🔒 === SNYK SCAN ==="
        }
        dir('backend') {
          sh '''#!/usr/bin/env bash
            set -euo pipefail
            npm ci
            npm install -g snyk

            snyk auth ${SNYK_TOKEN}
            echo "Running snyk test (high severity threshold)"
            snyk test --severity-threshold=high || echo "Vulns found (continuing)"
            snyk test --json > snyk-report.json || true
          '''
        }
      }
      post {
        always {
          archiveArtifacts artifacts: 'backend/snyk-report.json', allowEmptyArchive: true
        }
      }
    }
  }

  post {
    always {
      echo '🏁 === PIPELINE DONE ==='
      sh '''#!/usr/bin/env bash
        echo "📋 SUMMARY"
        echo "Build Number: ${BUILD_NUMBER}"
        echo "Build Version: ${BUILD_VERSION}"
        echo "Image: ${DOCKER_IMAGE}:${BUILD_VERSION}"
      '''
    }
  }
}
