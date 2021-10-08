# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

#!/bin/sh

npm run update-data -- -s

npm run burn bcd -- -c api -b all
npm run burn bcd -- -c css -b all
npm run burn bcd -- -c html -b all
npm run burn bcd -- -c javascript -b all
npm run burn bcd -- -c mathml -b all
npm run burn bcd -- -c webextensions -b all

npm run burn chrome -- -a -f -o -n needed-docs
npm run burn chrome -- -i -f -o -n puppy-planning
npm run burn chrome -- -c -n missing-members
npm run burn chrome -- -r fugu-rl.json -n fugu

npm run burn urls -- -c api
npm run burn urls -- -c css
npm run burn urls -- -c html
npm run burn urls -- -c javascript
# npm run burn urls -- -c mathml
# npm run burn urls -- -c webextensions