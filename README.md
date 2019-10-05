# CI-AUTO-VERSION
###  Automatic Versioning for Continuous Integration Pipelines

#### About
**ci-auto-version** is designed to seemlesly intagrate semantic versioning in to your pipeline automation. It is tested under bicbucket CI Pipelines but will work on others such as gitlab as well.

#### Usage
sample 'bitbucket-pipelines.yml' file

    image: node:10.15.3

    pipelines:
      branches:
        master:
          - step:
              caches:
                - node
              script: # Modify the commands below to build your repository.
                - npm install
                - # npm test
                - npm install ci-auto-version@0.2.0 --no-save
                - node node_modules/ci-auto-version/auto_version.js
            
The above pipeline automation script will run on every commit to master including merge requests. If you have npm test script in your package please uncomment # npm test line above to run your tests before.

#### Full Usage with Merge (Pull) Request and Postgres Database Support and npm test script implemented.
sample 'bitbucket-pipelines.yml' file

    image: node:10.15.3

    pipelines:
      branches:
        master:
          - step:
              caches:
                - node
              script: # Modify the commands below to build your repository.
                - npm install
                - npm test
                - npm install ci-auto-version@0.2.0 --no-save
                - node node_modules/ci-auto-version/auto_version.js
              services:
                - postgres

      pull-requests:
        '**': #this runs as default for any branch not elsewhere defined
          - step:
              caches:
                - node
              script: # Modify the commands below to build your repository.
                - npm install
                - npm test
              services:
                - postgres

    definitions:
      services:
        postgres:
          image: postgres
          variables:
            POSTGRES_DB: 'my_db_name'
            POSTGRES_USER: 'my_postgres_user'
            POSTGRES_PASSWORD: 'my_postgres_pwd'

The above code may be used to initiate your pipeline automation with full Postgres support. 
##### Notes
- Don't forget to change node version according to your package.
- Install during pipeline is invoked with --no-save , since ci-auto-versioning script modifies package.json and pushs to original repositories master. --no-save enables that our temporary installation during pipeline stays temporary.
- You may change ci-auto-version command line parameters. Eg. running it with --verbose or -v , will give more information about the on going process, exposing git commands and their results into the pipeline terminal.

##### Running Pipeline with Environment Variables

- **ci-auto-version** uses $CI_AUTO_VERSION environment varible to pass arguments pefore running the pipeline manually. 
- Please pass the arguments into $CI_AUTO_VERSION environment varible as string like   --force --verbose , or  -f -v   one line string.
- Run the pipeline manually.

**Example Usage:** 

_Force update existing tags:_

```javascript
node node_modules/ci-auto-version/auto_version.js --user UserName --email email@host.com -force
```
_OR_

_Execute using sh file showing git commands and results :_
```sh
sh node_modules/ci-auto-version/auto_version.sh -u Lorem -e ipsum@example.com -v
```

###### Command Line Options
-  --operation, -o major | minor | patch      Defines the semver digit to increase. Default: patch
-  --user, -u <UserName>   Defines username of commit to repository. Default: Latest Commit User
-  --email, -e <E-mail>    Defines email of commit to repository. Default: Latest Commit Email
-  --force-update, -f     Forces update tag if it already exists. Default: false
-  --print-result, -r    Prints result of the git commands to the pipeline terminal. Default : false
-  --print-command, -c   Prints git commands to the pipeline terminal. Default : false
-  --ignore-error, -i    Ignores errors and continue process with next command. Default: false (!NOT RECOMENDED)
-  --verbose, -v   Prints every output to the pipeline termial. Default: false
-  --silent, -s    Does not produce any output to the pipeline terminal. Default: false

