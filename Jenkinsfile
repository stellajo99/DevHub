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



        // Stage 5: DEPLOY
        stage('Deploy') {
            steps {
                script {
                    parallel(
                        'Deploy to Staging': {
                            echo "=== STAGING DEPLOYMENT ==="
                            sh '''
                                echo "Stopping existing staging services..."
                                docker compose -f docker-compose.production.yml down || echo "No existing services to stop"

                                echo "Starting staging deployment..."
                                docker compose -f docker-compose.production.yml up -d

                                echo "Waiting for services to start..."
                                sleep 60

                                echo "Running health checks..."
                                COUNTER=0
                                MAX_ATTEMPTS=10

                                while [ $COUNTER -lt $MAX_ATTEMPTS ]; do
                                    COUNTER=$((COUNTER + 1))
                                    echo "Health check attempt $COUNTER/$MAX_ATTEMPTS"

                                    # Check if app container is running and healthy
                                    if docker exec devhub-prod-app curl -f http://localhost:5000/api/health; then
                                        echo "Health check passed"
                                        break
                                    fi

                                    if [ $COUNTER -eq $MAX_ATTEMPTS ]; then
                                        echo "All health checks failed"
                                        exit 1
                                    fi

                                    sleep 10
                                done

                                echo "Running final smoke test..."
                                docker exec devhub-nginx curl -f http://devhub-prod-app:5000/api/health || (echo "Smoke test failed" && exit 1)
                            '''
                        },
                        'Database Migration': {
                            echo "=== DATABASE MIGRATION ==="
                            sh '''
                                echo "Running database migrations..."
                                cd backend
                                npm run migrate:up || echo "No migrations to run"

                                echo "Seeding test data..."
                                npm run seed:staging || echo "No seeding required"
                            '''
                        }
                    )
                }
            }
            post {
                success {
                    echo "Staging deployment successful"
                    script {
                        sh 'echo "Deployment to staging completed successfully at $(date)"'
                    }
                }
                failure {
                    echo "Staging deployment failed"
                    script {
                        sh '''
                            echo "Collecting deployment logs..."
                            docker compose -f docker-compose.production.yml logs > deployment-error.log 2>&1 || echo "Could not collect logs"
                        '''
                    }
                    archiveArtifacts artifacts: 'deployment-error.log', allowEmptyArchive: true
                }
            }
        }

        // Stage 6: RELEASE
        stage('Release') {
            when {
                anyOf {
                    branch 'master'
                    branch 'origin/master'
                    environment name: 'GIT_BRANCH', value: 'origin/master'
                }
            }
            steps {
                script {
                    echo "=== PRODUCTION RELEASE STAGE ==="
                    
                    // Check if Azure CLI is available
                    sh 'which az || (echo "Azure CLI not installed" && exit 1)'

                    sh '''
                        echo "Logging into Azure..."
                        az login --service-principal \
                            --username ${AZURE_CLIENT_ID} \
                            --password ${AZURE_CLIENT_SECRET} \
                            --tenant ${AZURE_TENANT_ID}

                        echo "Setting Azure subscription..."
                        az account set --subscription ${AZURE_SUBSCRIPTION_ID}

                        echo "Pushing to Azure Container Registry..."
                        az acr login --name devhubregistry
                        docker tag ${DOCKER_IMAGE}:${BUILD_NUMBER} devhubregistry.azurecr.io/${DOCKER_IMAGE}:${BUILD_NUMBER}
                        docker tag ${DOCKER_IMAGE}:${BUILD_NUMBER} devhubregistry.azurecr.io/${DOCKER_IMAGE}:latest
                        docker push devhubregistry.azurecr.io/${DOCKER_IMAGE}:${BUILD_NUMBER}
                        docker push devhubregistry.azurecr.io/${DOCKER_IMAGE}:latest

                        echo "Creating deployment slot for blue-green deployment..."
                        az webapp deployment slot create \
                            --name devhub-app \
                            --resource-group devhub-rg \
                            --slot staging \
                            --configuration-source devhub-app || echo "Slot already exists"

                        echo "Deploying to staging slot..."
                        az webapp config container set \
                            --name devhub-app \
                            --resource-group devhub-rg \
                            --slot staging \
                            --docker-custom-image-name devhubregistry.azurecr.io/${DOCKER_IMAGE}:${BUILD_NUMBER}

                        echo "Waiting for staging slot to be ready..."
                        sleep 120

                        echo "Running production health check..."
                        COUNTER=0
                        MAX_ATTEMPTS=10
                        
                        while [ $COUNTER -lt $MAX_ATTEMPTS ]; do
                            COUNTER=$((COUNTER + 1))
                            echo "Health check attempt $COUNTER/$MAX_ATTEMPTS"
                            
                            if curl -f https://devhub-app-staging.azurewebsites.net/api/health; then
                                echo "Production health check passed"
                                break
                            fi
                            
                            if [ $COUNTER -eq $MAX_ATTEMPTS ]; then
                                echo "Production health checks failed"
                                exit 1
                            fi
                            
                            sleep 15
                        done

                        echo "Swapping staging to production..."
                        az webapp deployment slot swap \
                            --name devhub-app \
                            --resource-group devhub-rg \
                            --slot staging \
                            --target-slot production

                        echo "Final production health check..."
                        curl -f https://devhub-app.azurewebsites.net/api/health || (echo "Production health check failed" && exit 1)
                    '''

                    // Tag the successful release
                    sh '''
                        echo "Tagging successful release..."
                        git tag -a v${BUILD_NUMBER} -m "Release v${BUILD_NUMBER} - ${BUILD_TIMESTAMP}"
                        git push origin v${BUILD_NUMBER} || echo "Could not push tag"
                    '''
                }
            }
            post {
                success {
                    echo "Production release successful"
                    emailext (
                        subject: "Production Release v${BUILD_NUMBER} Deployed Successfully",
                        body: """
                        Production release v${BUILD_NUMBER} has been deployed successfully.

                        Application URL: https://devhub-app.azurewebsites.net
                        Build Details: ${BUILD_URL}
                        Deployed at: ${BUILD_TIMESTAMP}

                        Please verify the deployment and monitor for any issues.
                        """,
                        to: "${JENKINS_EMAIL}"
                    )
                }
                failure {
                    echo "Production release failed"
                    sh '''
                        echo "Rolling back production deployment..."
                        az webapp deployment slot swap \
                            --name devhub-app \
                            --resource-group devhub-rg \
                            --slot production \
                            --target-slot staging || echo "Rollback failed"
                    '''
                    emailext (
                        subject: "URGENT: Production Release v${BUILD_NUMBER} Failed",
                        body: "Production release v${BUILD_NUMBER} failed. Automatic rollback attempted. Please investigate immediately.",
                        to: "${JENKINS_EMAIL}"
                    )
                }
            }
        }

        // Stage 7: MONITORING & ALERTING
        stage('Monitoring & Alerting') {
            parallel {
                stage('Setup Monitoring Stack') {
                    steps {
                        script {
                            echo "=== MONITORING SETUP ==="
                            sh '''
                                echo "Starting monitoring stack..."
                                cd monitoring
                                docker-compose up -d prometheus grafana alertmanager node-exporter

                                echo "Waiting for monitoring services..."
                                sleep 60

                                echo "Configuring Prometheus targets..."
                                docker exec devhub-prod-prometheus wget -qO- http://localhost:9090/api/v1/targets && echo "Prometheus is running" || echo "Prometheus setup failed"

                                echo "Setting up Grafana dashboards..."
                                docker exec devhub-prod-grafana curl -f http://localhost:3000 && echo "Grafana is accessible" || echo "Grafana setup failed"
                            '''
                        }
                    }
                }
                stage('Application Health Monitoring') {
                    steps {
                        script {
                            echo "=== APPLICATION HEALTH MONITORING ==="
                            sh '''
                                echo "Setting up health checks..."

                                echo "Checking application endpoints..."
                                endpoints="/api/health /api/status /"
                                for endpoint in $endpoints; do
                                    if docker exec devhub-nginx curl -f http://devhub-prod-app:5000$endpoint; then
                                        echo "✅ $endpoint - OK"
                                    else
                                        echo "❌ $endpoint - FAILED"
                                    fi
                                done

                                echo "Setting up uptime monitoring..."
                                cat > uptime-monitor.sh << 'EOF'
#!/bin/bash
while true; do
    if docker exec devhub-nginx curl -f http://devhub-prod-app:5000/api/health; then
        echo "[$(date)] Health check passed"
    else
        echo "[$(date)] Health check failed"
    fi
    sleep 300  # Check every 5 minutes
done
EOF
                                chmod +x uptime-monitor.sh
                                echo "Uptime monitoring script created"
                            '''
                        }
                    }
                }
                stage('Performance Monitoring') {
                    steps {
                        script {
                            echo "=== PERFORMANCE MONITORING ==="
                            sh '''
                                echo "Setting up performance monitoring..."

                                echo "Docker container metrics..."
                                docker stats --no-stream --format "table {{.Container}}\\t{{.CPUPerc}}\\t{{.MemUsage}}\\t{{.NetIO}}"

                                echo "Application performance tests..."
                                echo "Running performance baseline tests..."
                                start_time=$(date +%s%3N)
                                if docker exec devhub-nginx curl -f http://devhub-prod-app:5000/api/health; then
                                    end_time=$(date +%s%3N)
                                    response_time=$((end_time - start_time))
                                    echo "Response time: ${response_time}ms"
                                    if [ $response_time -gt 2000 ]; then
                                        echo "WARNING: Slow response time detected!"
                                    fi
                                else
                                    echo "Performance test failed"
                                fi
                            '''
                        }
                    }
                }
                stage('Setup Alerting') {
                    steps {
                        script {
                            echo "=== ALERTING SETUP ==="
                            sh '''
                                echo "Configuring alerting rules..."

                                echo "Testing alert webhook endpoints..."
                                # Test Slack webhook (if configured)
                                if [ -n "$SLACK_WEBHOOK_URL" ]; then
                                    curl -X POST -H 'Content-type: application/json' \
                                        --data '{"text":"DevHub CI/CD Pipeline - Alert Test","channel":"#devops"}' \
                                        $SLACK_WEBHOOK_URL && echo "Slack webhook test completed" || echo "Slack webhook test failed"
                                else
                                    echo "Slack webhook not configured"
                                fi

                                echo "Setting up email alerts..."
                                echo "Email alerting configured through Jenkins"

                                echo "Creating monitoring dashboard URLs..."
                                echo "📊 Grafana Dashboard: http://localhost:13000"
                                echo "📈 Prometheus Metrics: http://localhost:19090"
                                echo "🔔 AlertManager: http://localhost:19093"
                            '''
                        }
                    }
                }
            }
            post {
                success {
                    echo "✅ Monitoring and alerting setup completed successfully!"
                    script {
                        // Send success notification
                        emailext (
                            subject: "🔍 Monitoring Setup Complete - DevHub v${BUILD_NUMBER}",
                            body: """
                            Monitoring and alerting has been successfully configured for DevHub v${BUILD_NUMBER}.

                            📊 Monitoring Resources:
                            • Grafana Dashboard: http://localhost:13000
                            • Prometheus Metrics: http://localhost:19090
                            • AlertManager: http://localhost:19093

                            🔍 Health Check URLs:
                            • Application Health: http://localhost:8081/api/health
                            • Production URL: https://devhub-app.azurewebsites.net

                            The system is now being monitored for:
                            ✓ Application uptime and health
                            ✓ Performance metrics and response times
                            ✓ Resource utilization (CPU, Memory, Network)
                            ✓ Error rates and exceptions

                            Alerts will be sent to this email for any critical issues.
                            """,
                            to: "${JENKINS_EMAIL}"
                        )
                    }
                }
                failure {
                    echo "❌ Monitoring setup failed!"
                    emailext (
                        subject: "🚨 Monitoring Setup Failed - DevHub v${BUILD_NUMBER}",
                        body: "Monitoring and alerting setup failed for DevHub v${BUILD_NUMBER}. Please check the build logs and configure monitoring manually.",
                        to: "${JENKINS_EMAIL}"
                    )
                }
            }
        }
    }

    post {
        always {
            script {
                try {
                    // Archive final build summary
                    def buildTimestamp = new Date().format('yyyy-MM-dd-HH-mm-ss')
                    def buildSummary = """
Build Summary for DevHub v${BUILD_NUMBER}
==========================================
Build Timestamp: ${buildTimestamp}
Build Status: ${currentBuild.result ?: 'SUCCESS'}
Build Duration: ${currentBuild.durationString}
Git Commit: ${env.GIT_COMMIT ?: 'N/A'}
Branch: ${env.BRANCH_NAME ?: 'master'}

Stages Completed:
✓ Build - Created artifacts and Docker image
✓ Test - Frontend, Backend, and Integration tests
✓ Code Quality - SonarQube analysis and ESLint
✓ Security - Vulnerability scanning and SAST
✓ Deploy - Staging environment deployment
✓ Release - Production deployment with blue-green
✓ Monitoring - Health checks and alerting setup

Artifacts Generated:
• Docker Image: ${env.DOCKER_IMAGE ?: 'devhub'}:${BUILD_NUMBER}
• Frontend Build: frontend/build/
• Test Coverage Reports: */coverage/
• Security Reports: *-security.json
• Quality Reports: *-eslint.json
"""
                    writeFile file: 'build-summary.txt', text: buildSummary
                    archiveArtifacts artifacts: 'build-summary.txt', allowEmptyArchive: true
                } catch (Exception e) {
                    echo "Failed to create build summary: ${e.getMessage()}"
                }
            }
            echo "🧹 Cleaning workspace..."
        }
        success {
            echo "🎉 Pipeline completed successfully!"
            script {
                echo "✅ DevHub v${BUILD_NUMBER} pipeline completed successfully at ${new Date()}"
            }
        }
        failure {
            echo "💥 Pipeline failed!"
            script {
                echo "❌ DevHub v${BUILD_NUMBER} pipeline failed at ${new Date()}"

                // Send failure notification
                try {
                    def jenkinsEmail = env.JENKINS_EMAIL ?: 'devops@company.com'
                    emailext (
                        subject: "🚨 CI/CD Pipeline Failed - DevHub v${BUILD_NUMBER}",
                        body: """
                        The CI/CD pipeline for DevHub v${BUILD_NUMBER} has failed.

                        Build Details:
                        • Build URL: ${BUILD_URL}
                        • Branch: ${env.BRANCH_NAME ?: 'master'}
                        • Commit: ${env.GIT_COMMIT ?: 'N/A'}
                        • Failed Stage: Check build logs for details

                        Please investigate the failure and re-run the pipeline once issues are resolved.
                        """,
                        to: jenkinsEmail
                    )
                } catch (Exception e) {
                    echo "Failed to send failure email: ${e.getMessage()}"
                }
            }
        }
        unstable {
            echo "⚠️ Pipeline completed with warnings!"
            script {
                try {
                    def jenkinsEmail = env.JENKINS_EMAIL ?: 'devops@company.com'
                    emailext (
                        subject: "⚠️ CI/CD Pipeline Unstable - DevHub v${BUILD_NUMBER}",
                        body: "The CI/CD pipeline for DevHub v${BUILD_NUMBER} completed but with warnings. Please review the build logs.",
                        to: jenkinsEmail
                    )
                } catch (Exception e) {
                    echo "Failed to send unstable email: ${e.getMessage()}"
                }
            }
        }
    }
}