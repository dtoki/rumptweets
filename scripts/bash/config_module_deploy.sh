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
#resources of the computer that we want to utilize 
resources:
  cpu: .2
  memory_gb: 0.60
  disk_size_gb: 10
#auto scaling config
automatic_scaling:
  min_num_instances: 1
  max_num_instances: 5
  cool_down_period_sec: 120 # default value
  cpu_utilization:
    target_utilization: 0.75
# [END app_yaml]
EOT