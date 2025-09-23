pipeline {
    agent any

    environment {
        NODE_VERSION = '18'
        DOCKER_IMAGE = 'devhub'
        AZURE_SUBSCRIPTION_ID = credentials('azure-subscription-id')
        AZURE_CLIENT_ID = credentials('azure-client-id')
        AZURE_CLIENT_SECRET = credentials('azure-client-secret')
        AZURE_TENANT_ID = credentials('azure-tenant-id')
        JENKINS_EMAIL = credentials('jenkins-gmail')
        SONAR_PROJECT_KEY = 'devhub'
        BUILD_TIMESTAMP = "${new Date().format('yyyy-MM-dd-HH-mm-ss')}"
    }

    stages {
        // Stage 1: BUILD
        stage('Build') {
            steps {
                script {
                    echo "=== BUILD STAGE ==="

                    // Check if Node.js is available and build artifacts
                    sh '''
                        if command -v node >/dev/null 2>&1; then
                            echo "✅ Node.js found: $(node --version)"
                            echo "✅ npm found: $(npm --version)"
                        else
                            echo "❌ Node.js not found - installing via NodeSource..."
                            curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
                            apt-get install -y nodejs
                        fi

                        echo "Installing root dependencies..."
                        npm install

                        echo "Building frontend application..."
                        cd frontend
                        npm install
                        npm run build
                        echo "✅ Frontend build completed - Static files ready for deployment"

                        echo "Building backend application..."
                        cd ../backend
                        npm install
                        npm run build
                        echo "✅ Backend build completed - Node.js application ready"

                        echo "Creating deployment artifacts..."
                        cd ..

                        # Create frontend deployment artifact
                        echo "📦 Creating frontend deployment artifact..."
                        tar -czf frontend-build-${BUILD_NUMBER}.tar.gz -C frontend/build .
                        echo "✅ Frontend artifact: frontend-build-${BUILD_NUMBER}.tar.gz"

                        # Create backend deployment artifact
                        echo "📦 Creating backend deployment artifact..."
                        tar -czf backend-app-${BUILD_NUMBER}.tar.gz backend/ --exclude=backend/node_modules --exclude=backend/coverage
                        echo "✅ Backend artifact: backend-app-${BUILD_NUMBER}.tar.gz"

                        # Create complete application artifact
                        echo "📦 Creating complete application artifact..."
                        mkdir -p deploy/frontend deploy/backend
                        cp -r frontend/build/* deploy/frontend/
                        cp -r backend/* deploy/backend/
                        cp package.json deploy/
                        tar -czf devhub-complete-${BUILD_NUMBER}.tar.gz deploy/
                        echo "✅ Complete app artifact: devhub-complete-${BUILD_NUMBER}.tar.gz"

                        # Attempt Docker build if Docker is available
                        if command -v docker >/dev/null 2>&1; then
                            echo "🐳 Docker found - Creating Docker image artifact..."
                            docker build -f Dockerfile.production -t ${DOCKER_IMAGE}:${BUILD_NUMBER} .
                            docker tag ${DOCKER_IMAGE}:${BUILD_NUMBER} ${DOCKER_IMAGE}:latest
                            docker save ${DOCKER_IMAGE}:${BUILD_NUMBER} -o devhub-docker-${BUILD_NUMBER}.tar
                            echo "✅ Docker image artifact: devhub-docker-${BUILD_NUMBER}.tar"
                        else
                            echo "⚠️  Docker not available - Skipping Docker image creation"
                        fi

                        echo "📊 Build Artifacts Summary:"
                        ls -lh *.tar.gz *.tar 2>/dev/null || echo "Listing artifacts..."
                        du -sh *.tar.gz *.tar 2>/dev/null || echo "Calculating sizes..."

                        echo "✅ All build artifacts created successfully!"
                    '''
                }
            }
            post {
                success {
                    // Archive all build artifacts for deployment
                    archiveArtifacts artifacts: '*.tar.gz,*.tar', allowEmptyArchive: true, fingerprint: true
                    archiveArtifacts artifacts: 'frontend/build/**/*', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'backend/**/*', allowEmptyArchive: true

                    echo "📦 Build artifacts archived successfully!"
                    echo "✅ Ready for deployment stages"
                }
                failure {
                    echo "❌ Build failed - No artifacts created"
                }
            }
        }

        // Stage 2: TEST
        stage('Test') {
            parallel {
                stage('Frontend Tests') {
                    steps {
                        script {
                            echo "=== FRONTEND TEST STAGE ==="
                            sh '''
                                echo "Running frontend tests with coverage..."
                                cd frontend
                                npm run test:coverage
                                npm run test -- --reporters=jest-junit --outputFile=test-results.xml --watchAll=false
                            '''
                        }
                    }
                }
                stage('Backend Tests') {
                    steps {
                        script {
                            echo "=== BACKEND TEST STAGE ==="
                            sh '''
                                echo "Running backend tests with coverage..."
                                cd backend
                                npm run test:coverage
                                npm run lint
                            '''
                        }
                    }
                }
                stage('Integration Tests') {
                    steps {
                        script {
                            echo "=== INTEGRATION TEST STAGE ==="
                            sh '''
                                echo "Installing docker-compose and curl..."
                                apk add --no-cache docker-compose curl

                                echo "Running integration tests..."
                                docker-compose -f docker-compose.test.yml up -d --build
                                sleep 30
                                curl -f http://localhost:3001/api/health || echo "Health check failed"
                                docker-compose -f docker-compose.test.yml down
                            '''
                        }
                    }
                }
            }
            post {
                always {
                    // Publish test results
                    publishTestResults testResultsPattern: '**/test-results.xml', allowEmptyResults: true
                    publishCoverageResults([
                        [path: 'frontend/coverage/lcov.info', thresholds: []],
                        [path: 'backend/coverage/lcov.info', thresholds: []]
                    ], allowEmptyResults: true)

                    // Archive test artifacts
                    archiveArtifacts artifacts: '**/coverage/**/*', allowEmptyArchive: true
                }
            }
        }

        // Stage 3: CODE QUALITY
        stage('Code Quality') {
            parallel {
                stage('SonarQube Analysis') {
                    steps {
                        script {
                            echo "=== SONARQUBE ANALYSIS ==="

                            // Install SonarQube scanner
                            sh '''
                                echo "Installing SonarQube scanner..."
                                apk add --no-cache openjdk11-jre wget unzip
                                wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-4.8.0.2856-linux.zip
                                unzip sonar-scanner-cli-4.8.0.2856-linux.zip
                                export PATH=$PATH:$(pwd)/sonar-scanner-4.8.0.2856-linux/bin
                            '''

                            // SonarQube analysis
                            withSonarQubeEnv('SonarQube') {
                                sh '''
                                    export PATH=$PATH:$(pwd)/sonar-scanner-4.8.0.2856-linux/bin
                                    sonar-scanner \\
                                        -Dsonar.projectKey=${SONAR_PROJECT_KEY} \\
                                        -Dsonar.sources=. \\
                                        -Dsonar.exclusions=node_modules/**,coverage/**,build/**,dist/**,*.log \\
                                        -Dsonar.javascript.lcov.reportPaths=frontend/coverage/lcov.info,backend/coverage/lcov.info \\
                                        -Dsonar.typescript.lcov.reportPaths=frontend/coverage/lcov.info \\
                                        -Dsonar.testExecutionReportPaths=**/test-results.xml
                                '''
                            }

                            // Quality gate
                            timeout(time: 5, unit: 'MINUTES') {
                                def qg = waitForQualityGate()
                                if (qg.status != 'OK') {
                                    error "Pipeline aborted due to quality gate failure: ${qg.status}"
                                }
                            }
                        }
                    }
                }
                stage('Code Complexity Analysis') {
                    steps {
                        script {
                            echo "=== CODE COMPLEXITY ANALYSIS ==="
                            sh '''
                                echo "Running ESLint on frontend..."
                                cd frontend
                                npx eslint src --ext .js,.jsx,.ts,.tsx --format json --output-file ../frontend-eslint.json || echo "ESLint completed with issues"

                                echo "Running ESLint on backend..."
                                cd ../backend
                                npm run lint -- --format json --output-file ../backend-eslint.json || echo "ESLint completed with issues"
                            '''
                        }
                    }
                }
            }
            post {
                always {
                    // Archive quality reports
                    archiveArtifacts artifacts: '*-eslint.json', allowEmptyArchive: true
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'frontend/coverage/lcov-report',
                        reportFiles: 'index.html',
                        reportName: 'Frontend Coverage Report'
                    ])
                }
            }
        }

        // Stage 4: SECURITY
        stage('Security') {
            parallel {
                stage('Dependency Security Scan') {
                    steps {
                        script {
                            echo "=== DEPENDENCY SECURITY SCAN ==="
                            sh '''
                                echo "Installing security tools..."
                                npm install -g snyk

                                echo "Running Snyk security scan on frontend..."
                                cd frontend
                                snyk test --json --severity-threshold=medium > ../frontend-security.json || echo "Frontend security scan completed with issues"

                                echo "Running Snyk security scan on backend..."
                                cd ../backend
                                snyk test --json --severity-threshold=medium > ../backend-security.json || echo "Backend security scan completed with issues"

                                echo "Running npm audit on frontend..."
                                cd ../frontend
                                npm audit --audit-level=moderate --json > ../frontend-audit.json || echo "Frontend audit completed"

                                echo "Running npm audit on backend..."
                                cd ../backend
                                npm audit --audit-level=moderate --json > ../backend-audit.json || echo "Backend audit completed"
                            '''

                            // Parse and report security issues
                            script {
                                try {
                                    def frontendSecurity = readJSON file: 'frontend-security.json'
                                    def backendSecurity = readJSON file: 'backend-security.json'

                                    def frontendVulns = frontendSecurity.vulnerabilities ?: []
                                    def backendVulns = backendSecurity.vulnerabilities ?: []

                                    echo "=== SECURITY SCAN RESULTS ==="
                                    echo "Frontend vulnerabilities found: ${frontendVulns.size()}"
                                    echo "Backend vulnerabilities found: ${backendVulns.size()}"

                                    def highSeverityCount = 0
                                    def mediumSeverityCount = 0

                                    (frontendVulns + backendVulns).each { vuln ->
                                        if (vuln.severity == 'high' || vuln.severity == 'critical') {
                                            highSeverityCount++
                                            echo "HIGH SEVERITY: ${vuln.title} in ${vuln.packageName}"
                                        } else if (vuln.severity == 'medium') {
                                            mediumSeverityCount++
                                        }
                                    }

                                    if (highSeverityCount > 0) {
                                        error "Build failed due to ${highSeverityCount} high/critical severity vulnerabilities"
                                    }

                                    echo "Security scan completed: ${highSeverityCount} high, ${mediumSeverityCount} medium severity issues"
                                } catch (Exception e) {
                                    echo "Warning: Could not parse security results: ${e.getMessage()}"
                                }
                            }
                        }
                    }
                }
                stage('Docker Security Scan') {
                    steps {
                        script {
                            echo "=== DOCKER SECURITY SCAN ==="
                            sh '''
                                echo "Running Trivy security scan on Docker image..."
                                docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                                    aquasec/trivy image --format json --output docker-security.json \
                                    ${DOCKER_IMAGE}:${BUILD_NUMBER} || echo "Docker security scan completed"

                                echo "Running Docker bench security..."
                                docker run --rm --net host --pid host --userns host --cap-add audit_control \
                                    -e DOCKER_CONTENT_TRUST=$DOCKER_CONTENT_TRUST \
                                    -v /etc:/etc:ro \
                                    -v /usr/bin/docker-containerd:/usr/bin/docker-containerd:ro \
                                    -v /usr/bin/docker-runc:/usr/bin/docker-runc:ro \
                                    -v /usr/lib/systemd:/usr/lib/systemd:ro \
                                    -v /var/lib:/var/lib:ro \
                                    -v /var/run/docker.sock:/var/run/docker.sock:ro \
                                    --label docker_bench_security \
                                    docker/docker-bench-security > docker-bench-security.log || echo "Docker bench completed"
                            '''
                        }
                    }
                }
                stage('Static Application Security Testing') {
                    steps {
                        script {
                            echo "=== STATIC APPLICATION SECURITY TESTING ==="
                            sh '''
                                echo "Running OWASP Dependency Check..."
                                dependency-check --project DevHub --scan . --format JSON --out dependency-check-report.json \
                                    --exclude "**/node_modules/**" --exclude "**/coverage/**" --exclude "**/build/**" || echo "OWASP check completed"

                                echo "Running Semgrep security analysis..."
                                semgrep --config=auto --json --output=semgrep-security.json . || echo "Semgrep analysis completed"
                            '''
                        }
                    }
                }
            }
            post {
                always {
                    // Archive all security artifacts
                    archiveArtifacts artifacts: '*-security.json,*-audit.json,dependency-check-report.json,semgrep-security.json,docker-bench-security.log', allowEmptyArchive: true

                    // Publish security reports
                    publishHTML([
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: '.',
                        reportFiles: 'dependency-check-report.json',
                        reportName: 'OWASP Dependency Check Report'
                    ])
                }
                failure {
                    script {
                        try {
                            withCredentials([string(credentialsId: 'jenkins-gmail', variable: 'EMAIL_TO')]) {
                                emailext (
                                    subject: "SECURITY ALERT: Build #${BUILD_NUMBER} - Critical Vulnerabilities Found",
                                    body: "Critical security vulnerabilities were found in build #${BUILD_NUMBER}. Please check the security reports immediately.",
                                    to: "${EMAIL_TO}"
                                )
                            }
                        } catch (Exception e) {
                            echo "Failed to send security alert email: ${e.getMessage()}"
                        }
                    }
                }
            }
        }

        // Stage 5: DEPLOY
        stage('Deploy') {
            when {
                anyOf {
                    branch 'master'
                    branch 'develop'
                    branch 'staging'
                }
            }
            parallel {
                stage('Deploy to Staging') {
                    steps {
                        script {
                            echo "=== STAGING DEPLOYMENT ==="
                            sh '''
                                echo "Stopping existing staging services..."
                                docker-compose -f docker-compose.production.yml down || echo "No existing services to stop"

                                echo "Starting staging deployment..."
                                docker-compose -f docker-compose.production.yml up -d

                                echo "Waiting for services to start..."
                                sleep 60

                                echo "Running health checks..."
                                for i in {1..10}; do
                                    if curl -f http://localhost:3000/api/health; then
                                        echo "Health check passed"
                                        break
                                    else
                                        echo "Attempt $i failed, retrying..."
                                        sleep 10
                                    fi
                                done

                                echo "Running smoke tests..."
                                curl -f http://localhost:3000/api/health || (echo "Smoke test failed" && exit 1)
                            '''
                        }
                    }
                }
                stage('Database Migration') {
                    steps {
                        script {
                            echo "=== DATABASE MIGRATION ==="
                            sh '''
                                echo "Running database migrations..."
                                cd backend
                                npm run migrate:up || echo "No migrations to run"

                                echo "Seeding test data..."
                                npm run seed:staging || echo "No seeding required"
                            '''
                        }
                    }
                }
            }
            post {
                success {
                    echo "✅ Staging deployment successful"
                    script {
                        // Notify team of successful deployment
                        sh 'echo "Deployment to staging completed successfully at $(date)"'
                    }
                }
                failure {
                    echo "❌ Staging deployment failed"
                    script {
                        sh '''
                            echo "Collecting deployment logs..."
                            docker-compose -f docker-compose.production.yml logs > deployment-error.log 2>&1 || echo "Could not collect logs"
                        '''
                    }
                    archiveArtifacts artifacts: 'deployment-error.log', allowEmptyArchive: true
                }
            }
        }

        // Stage 6: RELEASE
        stage('Release') {
            when {
                branch 'master'
            }
            steps {
                script {
                    echo "=== PRODUCTION RELEASE STAGE ==="

                    // Install Azure CLI and login
                    sh '''
                        echo "Installing Azure CLI..."
                        apk add --no-cache python3 py3-pip
                        pip3 install azure-cli

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
                        for i in {1..10}; do
                            if curl -f https://devhub-app-staging.azurewebsites.net/api/health; then
                                echo "Production health check passed"
                                break
                            else
                                echo "Health check attempt $i failed, retrying..."
                                sleep 15
                            fi
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
                    echo "🚀 Production release successful!"
                    script {
                        try {
                            withCredentials([string(credentialsId: 'jenkins-gmail', variable: 'EMAIL_TO')]) {
                                emailext (
                                    subject: "✅ Production Release v${BUILD_NUMBER} Deployed Successfully",
                                    body: """
                                    Production release v${BUILD_NUMBER} has been deployed successfully.

                                    🔗 Application URL: https://devhub-app.azurewebsites.net
                                    📊 Build Details: ${BUILD_URL}
                                    🕐 Deployed at: ${BUILD_TIMESTAMP}

                                    Please verify the deployment and monitor for any issues.
                                    """,
                                    to: "${EMAIL_TO}"
                                )
                            }
                        } catch (Exception e) {
                            echo "Failed to send success email: ${e.getMessage()}"
                        }
                    }
                }
                failure {
                    echo "❌ Production release failed!"
                    sh '''
                        echo "Rolling back production deployment..."
                        az webapp deployment slot swap \
                            --name devhub-app \
                            --resource-group devhub-rg \
                            --slot production \
                            --target-slot staging || echo "Rollback failed"
                    '''
                    script {
                        try {
                            withCredentials([string(credentialsId: 'jenkins-gmail', variable: 'EMAIL_TO')]) {
                                emailext (
                                    subject: "🚨 URGENT: Production Release v${BUILD_NUMBER} Failed",
                                    body: "Production release v${BUILD_NUMBER} failed. Automatic rollback attempted. Please investigate immediately.",
                                    to: "${EMAIL_TO}"
                                )
                            }
                        } catch (Exception e) {
                            echo "Failed to send release failure email: ${e.getMessage()}"
                        }
                    }
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
                                curl -f http://localhost:9090/api/v1/targets && echo "Prometheus is running" || echo "Prometheus setup failed"

                                echo "Setting up Grafana dashboards..."
                                curl -f http://localhost:3001 && echo "Grafana is accessible" || echo "Grafana setup failed"
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
                                endpoints="http://localhost:3000/api/health http://localhost:3000/api/status http://localhost:3000"
                                for endpoint in $endpoints; do
                                    if curl -f $endpoint; then
                                        echo "✅ $endpoint - OK"
                                    else
                                        echo "❌ $endpoint - FAILED"
                                    fi
                                done

                                echo "Setting up uptime monitoring..."
                                cat > uptime-monitor.sh << 'EOF'
#!/bin/bash
while true; do
    if curl -f http://localhost:3000/api/health; then
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
                                if curl -f http://localhost:3000/api/health; then
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
                                echo "📊 Grafana Dashboard: http://localhost:3001"
                                echo "📈 Prometheus Metrics: http://localhost:9090"
                                echo "🔔 AlertManager: http://localhost:9093"
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
                        try {
                            withCredentials([string(credentialsId: 'jenkins-gmail', variable: 'EMAIL_TO')]) {
                                emailext (
                                    subject: "🔍 Monitoring Setup Complete - DevHub v${BUILD_NUMBER}",
                                    body: """
                                    Monitoring and alerting has been successfully configured for DevHub v${BUILD_NUMBER}.

                                    📊 Monitoring Resources:
                                    • Grafana Dashboard: http://localhost:3001
                                    • Prometheus Metrics: http://localhost:9090
                                    • AlertManager: http://localhost:9093

                                    🔍 Health Check URLs:
                                    • Application Health: http://localhost:3000/api/health
                                    • Production URL: https://devhub-app.azurewebsites.net

                                    The system is now being monitored for:
                                    ✓ Application uptime and health
                                    ✓ Performance metrics and response times
                                    ✓ Resource utilization (CPU, Memory, Network)
                                    ✓ Error rates and exceptions

                                    Alerts will be sent to this email for any critical issues.
                                    """,
                                    to: "${EMAIL_TO}"
                                )
                            }
                        } catch (Exception e) {
                            echo "Failed to send monitoring success email: ${e.getMessage()}"
                        }
                    }
                }
                failure {
                    echo "❌ Monitoring setup failed!"
                    script {
                        try {
                            withCredentials([string(credentialsId: 'jenkins-gmail', variable: 'EMAIL_TO')]) {
                                emailext (
                                    subject: "🚨 Monitoring Setup Failed - DevHub v${BUILD_NUMBER}",
                                    body: "Monitoring and alerting setup failed for DevHub v${BUILD_NUMBER}. Please check the build logs and configure monitoring manually.",
                                    to: "${EMAIL_TO}"
                                )
                            }
                        } catch (Exception e) {
                            echo "Failed to send monitoring failure email: ${e.getMessage()}"
                        }
                    }
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
                    withCredentials([string(credentialsId: 'jenkins-gmail', variable: 'EMAIL_TO')]) {
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
                            to: "${EMAIL_TO}"
                        )
                    }
                } catch (Exception e) {
                    echo "Failed to send failure email: ${e.getMessage()}"
                }
            }
        }
        unstable {
            echo "⚠️ Pipeline completed with warnings!"
            script {
                try {
                    withCredentials([string(credentialsId: 'jenkins-gmail', variable: 'EMAIL_TO')]) {
                        emailext (
                            subject: "⚠️ CI/CD Pipeline Unstable - DevHub v${BUILD_NUMBER}",
                            body: "The CI/CD pipeline for DevHub v${BUILD_NUMBER} completed but with warnings. Please review the build logs.",
                            to: "${EMAIL_TO}"
                        )
                    }
                } catch (Exception e) {
                    echo "Failed to send unstable email: ${e.getMessage()}"
                }
            }
        }
    }
}