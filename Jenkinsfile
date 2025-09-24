// Jenkinsfile
pipeline {
    agent any

    environment {
        NODE_VERSION = '18'
        DOCKER_IMAGE = 'devhub'
        SONAR_PROJECT_KEY = 'stellajo99_DevHub'
        BUILD_TIMESTAMP = "${new Date().format('yyyy-MM-dd-HH-mm-ss')}"
        JENKINS_EMAIL = 'stellamore99@gmail.com'
    }

    stages {
                // Stage 1: BUILD
        stage('Build') {
            steps {
                script {
                    echo "=== BUILD STAGE ==="

                    // Install dependencies and build
                    sh '''
                        echo "Installing root dependencies..."
                        npm install

                        echo "Building frontend..."
                        cd frontend
                        npm install
                        npm run build

                        echo "Building backend..."
                        cd ../backend
                        npm install
                        npm run build

                        echo "Building Docker image..."
                        cd ..
                        docker build -f Dockerfile.production -t ${DOCKER_IMAGE}:${BUILD_NUMBER} .
                        docker tag ${DOCKER_IMAGE}:${BUILD_NUMBER} ${DOCKER_IMAGE}:latest
                    '''
                }
            }
            post {
                success {
                    // Archive build artifacts
                    archiveArtifacts artifacts: 'frontend/build/**/*', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'backend/dist/**/*', allowEmptyArchive: true, fingerprint: true
                }
            }
        }

        // Stage 2: TEST
        stage('Test') {
            environment {
                BE_JUNIT = 'backend/test-results.xml'
                BE_COBERTURA = 'backend/coverage/cobertura-coverage.xml'
            }
            steps {
                catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
                    dir('backend') {
                        sh '''#!/usr/bin/env bash
                        set -e

                        echo ">>> Installing backend dependencies"
                        npm ci

                        echo ">>> Install jest-junit reporter"
                        npm install --no-save jest-junit

                        echo ">>> Run tests from ./tests folder with JUnit + coverage"
                        JEST_JUNIT_OUTPUT="test-results.xml" \
                        npx jest tests --runInBand \
                            --reporters=default --reporters=jest-junit \
                            --coverage || true
                        '''
                    }
                }
            }
            post {
                always {
                    script {
                        if (fileExists(env.BE_JUNIT)) {
                            junit allowEmptyResults: true, testResults: env.BE_JUNIT
                        } else {
                            echo "JUnit report not found: ${env.BE_JUNIT}"
                        }
                    }
                    script {
                        if (fileExists(env.BE_COBERTURA)) {
                            step([$class: 'CoberturaPublisher',
                                coberturaReportFile: env.BE_COBERTURA,
                                onlyStable: false, failNoReports: false,
                                autoUpdateHealth: false, autoUpdateStability: false])
                        } else {
                            echo "Coverage report not found: ${env.BE_COBERTURA}"
                        }
                    }
                    archiveArtifacts artifacts: 'backend/coverage/**/*', allowEmptyArchive: true
                }
            }
        }

        // Stage 3: CODE QUALITY 
        stage('Code Quality') {
            environment {
                SONAR_TOKEN = credentials('SONAR_TOKEN')
            }
            steps {
                script {
                    sh '''
                        echo "=== SONARCLOUD ANALYSIS ==="
                        cd backend
                        
                        # Install sonar-scanner via npm
                        echo "Installing SonarScanner..."
                        npm install -g sonar-scanner
                        
                        # Run SonarCloud analysis
                        echo "Running SonarCloud analysis..."
                        sonar-scanner \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                            -Dsonar.organization=stellajo99 \
                            -Dsonar.sources=src \
                            -Dsonar.host.url=https://sonarcloud.io \
                            -Dsonar.token=${SONAR_TOKEN} \
                            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info || echo "SonarCloud analysis completed with issues"
    
                    '''
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'backend/eslint-results.json,backend/npm-audit.json', allowEmptyArchive: true
                }
            }
        }

        // Stage 4: SECURITY
        stage('Security scan') {
            environment {
                SNYK_TOKEN = credentials('SNYK_TOKEN')
            }
            steps {
                script {
                    sh '''
                        echo "=== SNYK SECURITY SCAN ==="
                        cd backend
                        
                        # Install Snyk CLI
                        npm install -g snyk
                        
                        # Authenticate with Snyk
                        snyk auth $SNYK_TOKEN
                        
                        # Run vulnerability test
                        echo "Running Snyk security scan..."
                        snyk test --severity-threshold=high || echo "Security vulnerabilities found but continuing..."
                        
                        # Optional: Generate JSON report
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
}