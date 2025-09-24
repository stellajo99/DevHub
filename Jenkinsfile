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
         MONGOMS_DOWNLOAD_DIR = "${env.WORKSPACE}/.cache/mongodb-binaries"
      }
      steps {
        script {
          echo "🧪 === TEST STAGE ==="

        
          sh '''
            set -e
            echo "🧪 Run backend tests with mongodb-memory-server"

            mkdir -p "$MONGOMS_DOWNLOAD_DIR"

            cd backend
            npm ci --no-audit --prefer-offline


            export PORT=${PORT:-0}


            npm test -- --runInBand

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
