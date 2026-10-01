// Declarative Jenkins pipeline for the Task API.
// Requirements on the Jenkins server: Git, Node.js 22, Docker, curl.
// Jenkins plugins: Pipeline, Git, GitHub (for webhook triggers), JUnit.

pipeline {
    agent any

    triggers {
        // Triggered by the GitHub webhook (see docs/jenkins-setup.md)
        githubPush()
    }

    options {
        timestamps()
        timeout(time: 15, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        IMAGE_NAME = 'task-api'
        SMOKE_CONTAINER = "task-api-smoke-${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Tooling Check') {
            steps {
                sh 'node --version && npm --version && docker --version'
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint'
            }
        }

        stage('Test') {
            steps {
                sh 'npm run test:ci'
            }
            post {
                always {
                    junit 'test-results.xml'
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh 'docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} -t ${IMAGE_NAME}:latest .'
            }
        }

        stage('Docker Smoke Test') {
            steps {
                sh '''
                    docker run -d --name ${SMOKE_CONTAINER} -p 127.0.0.1:3001:3000 ${IMAGE_NAME}:${BUILD_NUMBER}
                    sleep 3
                    curl -fsS http://127.0.0.1:3001/health
                '''
            }
            post {
                always {
                    sh 'docker rm -f ${SMOKE_CONTAINER} || true'
                }
            }
        }
    }

    post {
        success {
            echo 'CI pipeline PASSED'
        }
        failure {
            echo 'CI pipeline FAILED - check the stage logs above'
        }
        cleanup {
            cleanWs()
        }
    }
}
