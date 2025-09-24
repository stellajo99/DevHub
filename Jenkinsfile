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
        NODE_ENV = 'test'
      }
      steps {
        script {
          echo "🧪 === TEST STAGE ==="

        
          sh '''
            set -e
            echo "▶ Start MongoDB on a RANDOM host port"
            docker rm -f devhub-ci-mongo >/dev/null 2>&1 || true
            docker run -d --name devhub-ci-mongo -p 0:27017 mongo:7 --quiet

            HOST_PORT=$(docker port devhub-ci-mongo 27017/tcp | awk -F: '{print $2}')
            echo "Mongo is using random port: ${HOST_PORT}"

            echo "▶ Tools"
            (command -v nc >/dev/null) || (apt-get update && apt-get install -y netcat-openbsd >/dev/null)

            DB_HOST=host.docker.internal
            if ! ping -c1 -W1 ${DB_HOST} >/dev/null 2>&1; then
              DB_HOST=$(ip route | awk '/default/ {print $3}' | head -n1)
            fi
            echo "DB_HOST=${DB_HOST}"

            echo "▶ Wait Mongo up (host connectivity)"
            for i in $(seq 1 30); do
              if nc -z ${DB_HOST} ${HOST_PORT}; then
                echo "✅ Mongo reachable at ${DB_HOST}:${HOST_PORT}"
                break
              fi
              echo "⏳ Waiting Mongo... ($i/30)"
              sleep 1
            done

            echo "▶ Smoke test with mongosh (inside container)"
            docker exec devhub-ci-mongo mongosh --eval "db.runCommand({ ping: 1 })" --quiet

            echo "▶ Install backend deps"
            cd backend
            npm ci --no-audit --prefer-offline
            cd ..

            echo "▶ Start backend server in background (PORT=5000)"
            export PORT=5000
            export JWT_SECRET=testsecret
            export MONGODB_URI="mongodb://${DB_HOST}:${HOST_PORT}/devhub_ci?directConnection=true"
            node backend/src/server.js > backend_test.log 2>&1 &
            SRV_PID=$!
            echo "Server started with PID: ${SRV_PID}"

            echo "▶ Wait for health endpoint and database connection"
            for i in $(seq 1 60); do
              RES=$(curl -s "http://127.0.0.1:${PORT}/api/health" || true)
              echo "Health: $RES"
              echo "$RES" | grep -q '"status":"OK"' && echo "$RES" | grep -q '"database":{"status":"connected"}' && break
              sleep 1
            done

            echo "▶ Run tests"
            cd backend
            npm test -- --runInBand || EXIT_CODE=$?
            cd ..

            echo "▶ Stop backend & teardown Mongo"
            kill ${SRV_PID} 2>/dev/null || true
            docker rm -f devhub-ci-mongo >/dev/null 2>&1 || true

            exit ${EXIT_CODE:-0}

          '''
        }
      }
      post {
        always {
          echo '🧹 Test stage cleanup done'
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
