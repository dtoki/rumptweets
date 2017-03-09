#!/bin/bash
servicename=$1
branchname=$2
echo $branchname

if [ -f app/$servicename/$servicename.yaml ]; then
    echo "File found! deleting"
    rm app/$servicename/$servicename.yaml
fi

    
cat <<EOT >> app/$servicename/${servicename}.yaml 
# Copyright 2015-2016, Google, Inc.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# [START app_yaml]
service: ${servicename}-${branchname}
runtime: nodejs
env: flex
#Not threadsafe until you can know when a connection is already established then you don't connect
threadsafe: false
#resources of the computer that we want to utilize 
resources:
  cpu: 1
  memory_gb: 0.6
  disk_size_gb: 10
#disable health_check until we can figure out what it does and how it force restarts https://cloud.google.com/appengine/docs/flexible/nodejs/configuring-your-app-with-app-yaml
health_check:
    enable_health_check: false
#only run one instances of this service
manual_scaling:
    instances: 1

# [END app_yaml]
EOT