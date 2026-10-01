#!/bin/bash
# Installs Jenkins, Java, Git, Docker and Node.js 22 on Ubuntu 22.04 / 24.04.
# Usage: bash scripts/install-jenkins-ubuntu.sh
set -euo pipefail

echo "==> Installing base packages"
sudo apt-get update -y
sudo apt-get install -y fontconfig openjdk-17-jre git docker.io curl gnupg ca-certificates

echo "==> Installing Node.js 22"
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "==> Adding the Jenkins apt repository"
sudo mkdir -p /usr/share/keyrings
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key \
  | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" \
  | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null

echo "==> Installing Jenkins"
sudo apt-get update -y
sudo apt-get install -y jenkins

echo "==> Allowing the jenkins user to run Docker"
sudo usermod -aG docker jenkins

sudo systemctl enable --now docker
sudo systemctl enable --now jenkins
sudo systemctl restart jenkins

echo
echo "Jenkins is running on port 8080: http://<EC2-PUBLIC-IP>:8080"
echo "Initial admin password:"
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
