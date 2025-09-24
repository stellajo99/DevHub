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

                # Use a random available port instead of host networking
                # Try multiple approaches to get a random port
                if command -v python3 >/dev/null 2>&1; then
                  MONGO_PORT=\$(python3 -c "import socket; s=socket.socket(); s.bind(('',0)); print(s.getsockname()[1]); s.close()")
                elif command -v python >/dev/null 2>&1; then
                  MONGO_PORT=\$(python -c "import socket; s=socket.socket(); s.bind(('',0)); print(s.getsockname()[1]); s.close()")
                else
                  # Fallback to a high port range if Python is not available
                  MONGO_PORT=\$((27000 + RANDOM % 1000))
                  echo "⚠️ Python not available, using fallback port: \$MONGO_PORT"
                fi
                docker run -d --name ci-mongo -p \${MONGO_PORT}:27017 mongo:6 >/dev/null
                echo "Mongo is using random port: \$MONGO_PORT"

                echo "▶ Testing MongoDB connectivity"
                echo "Waiting for MongoDB to be ready..."
                for i in {1..30}; do
                  if docker exec ci-mongo mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
                    echo "✅ MongoDB container is ready"
                    break
                  else
                    echo "⏳ MongoDB not ready yet... (attempt \$i/30)"
                    sleep 1
                  fi
                done

                echo "Testing host connectivity to MongoDB..."
                if command -v nc >/dev/null 2>&1 && nc -z 127.0.0.1 \$MONGO_PORT; then
                  echo "✅ Host can connect to MongoDB port \$MONGO_PORT"
                else
                  echo "⚠️ nc not available or cannot connect to MongoDB port \$MONGO_PORT from host"
                fi

                echo "Testing MongoDB with mongosh from host..."
                if command -v mongosh >/dev/null 2>&1 && mongosh "mongodb://127.0.0.1:\$MONGO_PORT/test" --eval "db.adminCommand('ping')" --quiet; then
                  echo "✅ Can connect to MongoDB with mongosh"
                else
                  echo "⚠️ mongosh not available on host or cannot connect"
                  echo "Checking if MongoDB container is responding..."
                  docker logs ci-mongo --tail 10
                fi

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

                echo "Starting server with MongoDB URI: \$MONGODB_URI"
                node backend/src/server.js > backend/test-server.log 2>&1 & echo \$! > backend/test-server.pid

                echo "Server started with PID: \$(cat backend/test-server.pid)"
                sleep 3
                echo "Initial server log output:"
                cat backend/test-server.log || echo "No log output yet"

                echo "▶ Wait for health endpoint and database connection"
                for i in {1..40}; do
                  # Check if server process is still running
                  if [ -f backend/test-server.pid ]; then
                    PID=\$(cat backend/test-server.pid)
                    if ! kill -0 \$PID 2>/dev/null; then
                      echo "❌ Server process died! Showing logs:"
                      cat backend/test-server.log
                      exit 1
                    fi
                  fi

                  HEALTH_RESPONSE=\$(curl -s http://127.0.0.1:5000/api/health 2>/dev/null || echo "")
                  if echo "\$HEALTH_RESPONSE" | grep -q '"status":"OK"'; then
                    echo "✅ Server and database are ready"
                    break
                  elif [ ! -z "\$HEALTH_RESPONSE" ]; then
                    echo "⏳ Server responding but not ready... (attempt \$i/40)"
                    echo "   Response: \$HEALTH_RESPONSE"
                    sleep 2
                  else
                    echo "⏳ Server not responding... (attempt \$i/40)"
                    sleep 2
                  fi

                  # Show server logs if we're failing for a while
                  if [ \$i -eq 20 ]; then
                    echo "🔍 Still failing after 20 attempts, showing server logs:"
                    cat backend/test-server.log || echo "No server logs available"
                  fi
                done

                # Final check - if we exhausted all attempts, show logs
                FINAL_HEALTH=\$(curl -s http://127.0.0.1:5000/api/health 2>/dev/null || echo "")
                if ! echo "\$FINAL_HEALTH" | grep -q '"status":"OK"'; then
                  echo "❌ Health check failed after all attempts"
                  echo "Final health response: \$FINAL_HEALTH"
                  echo "Server logs:"
                  cat backend/test-server.log || echo "No server logs available"
                  echo "MongoDB logs:"
                  docker logs ci-mongo --tail 30 || echo "No MongoDB logs available"
                  exit 1
                fi

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
