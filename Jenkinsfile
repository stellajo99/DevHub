pipeline {
    agent any

    environment {
        NODE_VERSION = '18'
        DOCKER_IMAGE = 'devhub'
        AZURE_SUBSCRIPTION_ID = credentials('azure-subscription-id')
        AZURE_CLIENT_ID = credentials('azure-client-id')
        AZURE_CLIENT_SECRET = credentials('azure-client-secret')
        AZURE_TENANT_ID = credentials('azure-tenant-id')
    }

    stages {
        // Stage 1: BUILD
        stage('Build') {
            steps {
                script {
                    echo "=== BUILD STAGE ==="

                    // Install dependencies and build
                    sh '''
                        echo "Building frontend..."
                        cd frontend
                        npm install
                        npm run build

                        echo "Building backend..."
                        cd ../backend
                        npm install

                        echo "Building Docker image..."
                        cd ..
                        docker build -f Dockerfile.production -t ${DOCKER_IMAGE}:${BUILD_NUMBER} .
                    '''
                }
            }
        }

        // Stage 2: TEST
        stage('Test') {
            steps {
                script {
                    echo "=== TEST STAGE ==="

                    sh '''
                        echo "Running frontend tests..."
                        cd frontend
                        npm test -- --coverage --watchAll=false

                        echo "Running backend tests..."
                        cd ../backend
                        npm test
                    '''
                }
            }
            post {
                always {
                    publishTestResults testResultsPattern: '**/test-results.xml'
                    publishCoverageResults coverageFiles: '**/coverage/lcov.info'
                }
            }
        }

        // Stage 3: CODE QUALITY
        stage('Code Quality') {
            steps {
                script {
                    echo "=== CODE QUALITY STAGE ==="

                    // SonarQube analysis
                    withSonarQubeEnv('SonarQube') {
                        sh '''
                            sonar-scanner \
                                -Dsonar.projectKey=devhub \
                                -Dsonar.sources=. \
                                -Dsonar.exclusions=node_modules/**,coverage/**,build/**,dist/**
                        '''
                    }

                    // Quality gate
                    timeout(time: 5, unit: 'MINUTES') {
                        waitForQualityGate abortPipeline: true
                    }
                }
            }
        }

        // Stage 4: SECURITY
        stage('Security') {
            steps {
                script {
                    echo "=== SECURITY STAGE ==="

                    sh '''
                        echo "Running Snyk security scan..."
                        cd frontend && snyk test --json > ../frontend-security.json || true
                        cd ../backend && snyk test --json > ../backend-security.json || true

                        echo "Docker security scan..."
                        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                            aquasec/trivy image ${DOCKER_IMAGE}:${BUILD_NUMBER} > docker-security.json || true
                    '''
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: '*-security.json', allowEmptyArchive: true
                }
            }
        }

        // Stage 5: DEPLOY
        stage('Deploy') {
            steps {
                script {
                    echo "=== DEPLOY STAGE ==="

                    sh '''
                        echo "Starting deployment..."
                        docker-compose -f docker-compose.production.yml down || true
                        docker-compose -f docker-compose.production.yml up -d

                        echo "Waiting for services to start..."
                        sleep 30

                        echo "Health check..."
                        curl -f http://localhost:3000/api/health || exit 1
                    '''
                }
            }
        }

        // Stage 6: RELEASE
        stage('Release') {
            steps {
                script {
                    echo "=== RELEASE STAGE ==="

                    // Azure login and release
                    sh '''
                        echo "Logging into Azure..."
                        az login --service-principal \
                            --username $AZURE_CLIENT_ID \
                            --password $AZURE_CLIENT_SECRET \
                            --tenant $AZURE_TENANT_ID

                        echo "Pushing to Azure Container Registry..."
                        az acr login --name devhubregistry
                        docker tag ${DOCKER_IMAGE}:${BUILD_NUMBER} devhubregistry.azurecr.io/${DOCKER_IMAGE}:${BUILD_NUMBER}
                        docker push devhubregistry.azurecr.io/${DOCKER_IMAGE}:${BUILD_NUMBER}

                        echo "Deploying to Azure App Service..."
                        az webapp config container set \
                            --name devhub-app \
                            --resource-group devhub-rg \
                            --docker-custom-image-name devhubregistry.azurecr.io/${DOCKER_IMAGE}:${BUILD_NUMBER}
                    '''
                }
            }
        }

        // Stage 7: MONITORING
        stage('Monitoring') {
            steps {
                script {
                    echo "=== MONITORING STAGE ==="

                    sh '''
                        echo "Setting up monitoring..."
                        docker-compose -f docker-compose.production.yml up -d prometheus grafana

                        echo "Checking application health..."
                        curl -f http://localhost:3000/api/health
                        curl -f http://localhost:9090/api/v1/query?query=up

                        echo "Monitoring setup complete!"
                    '''
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo "Pipeline completed successfully!"
        }
        failure {
            echo "Pipeline failed!"
        }
    }
}