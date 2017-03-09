#cd into travis build dir list the folders then deploy

cd $TRAVIS_BUILD_DIR
ls
firebase deploy --token ${FIREBASE_API_TOKEN} --only hosting

exit