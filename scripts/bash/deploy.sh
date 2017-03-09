#!/bin/bash
cd $TRAVIS_BUILD_DIR
ls
firebase deploy --token ${FIREBASE_API_TOKEN} --only hosting

exit 0;