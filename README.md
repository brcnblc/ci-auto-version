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

_Force update existing tags :_ 
```javascript
node ./node_modules/ci-auto-version/auto_version.js --user UserName --email email@host.com -force
```
OR

_Execute using sh file showing git commands and results :_ 
```sh
sh ./node_modules/ci-auto-version/auto_version.sh -u Lorem -e ipsum@example.com -v
```
###### Command Line Options
--operation, -op [ major | minor | patch | ignore ] 
  Defines the semver digit to increase.

--user-name, -us [ <UserName> | last_commit_author ] 
  Defines username of commit to repository.

--email, -em [ <E-Mail> | last_commit_email ] 
  Defines email of commit to repository.

--commit-message, -cm [ "<CommitMessage>" | last_commit_message ] 
  Defines commit message of the commit to repository.

--force-tag, -ft         
  Forces update tag if it already exists.

--ignore-error, -ir      
  Ignores errors and continue process with next command.(NOT RECOMENDED!)

--print-result, -pr      
  Prints result of the git commands to the pipeline terminal.

--print-command, -pd     
  Prints git commands to the pipeline terminal.

--print-parameters, -pp  
  Prints run time parameters to the pipeline terminal.

--print-arguments, -pa   
  Prints command line arguments to the pipeline terminal.

--print-envvar, -pe      
  Prints environment variable content to the pipeline terminal.

--verbose, -vb           
  Prints all output including git commands and results to the pipeline terminal.

--silent, -si            
  Does not print anything rather than errors to the pipeline terminal.

--major-pattern, -mj <PatternString> 
  Defines commit message pattern for major version upgrade.

--minor-pattern, -mp <PatternString> 
  Defines commit message pattern for minor version upgrade.

--patch-pattern, -pp <PatternString> 
  Defines commit message pattern for minor version upgrade.

--ignore-pattern, -gp <PatternString> 
  Defines commit message pattern to bypass version upgrade.

--default-action, -df [ patch | minor | major | ignore ] 
  Defines default action when no pattern matched in commit message.

--skip-ci-pattern, -sp <PatternString> 
  Defines pipeline command used in commit message, not to run pipeline.

--no-skip-ci, -ns        
  Does not add skip-ci-pattern eg.[skip CI] into commit message. Pipeline runs twice but version does not change since there will be no commit on last run.

--version-prefix, -vp <VersionPrefix> 
  Defines string which will be added as prefix of the version in tag name. Eg. v2.3.12

--initial-version, -vi <major>.<minor>.<patch> 
  The initial value of version if no version tag is found and it can not be extracted from package file.

--package-file, -pf <PackageFileName.json> 
  Json file in which version field will be changed.

--version-field, -pv <VersionFieldName> 
  Version field name which will be updated in package json file.

--env-var, -ev <EnvironmentVariableName> 
  Environment Variable name which is used to pass arguments.

--simulate, -sm          
  Simulates write to file and git commands preventing permanent changes to the repo.

--test-repo, -tr <TestRepoAddress> 
  Defines remote repository changes are pushed.

--test-folder, -tf <TestFolderName> 
  Defines local folder where git commands are executed.

--test-run, -test        
  Runs in test mode where git commands are executed in local test folder and changes are pushed to test repo

--test-message, -tm "<TestCommitMessage>" 
  Defines commit message for test purposes from where version command is extracted.

--create-test-commit, -ct <CommitMessage> 
  Creates a new test commit to test versioning.

