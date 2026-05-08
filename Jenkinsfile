pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "laranode-pro-app"
        CONTAINER_NAME = "laranode-prod"
        APP_PORT = 5000
    }

    stages {
        stage('Pull Source Code') {
            steps {
                echo 'Pulling source code from SCM...'
                checkout scm
            }
        }

        stage('Vulnerability Scan') {
            steps {
                echo 'Start scan...'
                // Simulasi scan kerentanan
                echo 'Analyzing dependencies for vulnerabilities...'
                sh 'sleep 2' 
                echo 'Finish scan.'
            }
        }

        stage('Build Image') {
            steps {
                echo 'Building Docker image...'
                sh "docker build -t ${DOCKER_IMAGE}:latest ."
            }
        }

        stage('Run Docker') {
            steps {
                echo 'Running Docker container...'
                // Menghapus kontainer lama jika ada sebelum menjalankan yang baru
                sh """
                    docker stop ${CONTAINER_NAME} || true
                    docker rm ${CONTAINER_NAME} || true
                    docker run -d --name ${CONTAINER_NAME} -p ${APP_PORT}:3000 --env-file /root/demo-cicd/.env ${DOCKER_IMAGE}:latest
                """
                echo """Application is running on port 3000"""
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Please check the logs.'
        }
        always {
            // Cleanup dangling images
            sh 'docker image prune -f || true'
        }
    }
}