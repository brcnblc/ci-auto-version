# CI-AUTO-VERSION
###  Automatic Versioning for Continuous Integration Pipelines

#### About
**ci-auto-version** is designed to seemlesly intagrate semantic versioning in to your pipeline automation. It is tested under bicbucket CI Pipelines but will work on others such as gitlab as well.

#### Usage
Add [minor] or [major] into the merge commit message to upgrade respective semver digit. If nothing is added, patch upgrade will be implemented by default.

#### Installation to pipeline
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
                - npm install ci-auto-version@0.3.0 --no-save
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
                - npm install ci-auto-version@0.3.0 --no-save
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

The above code may be used to initiate your pipeline automation with full Postgres support. Note that ci-auto-version runs only on commits to master. Other test codes run on merge requests.

##### Notes
- Don't forget to change node version according to your package.
- Install during pipeline is invoked with --no-save , since ci-auto-versioning script modifies package.json and pushs to original repositories master. --no-save enables that our temporary installation during pipeline stays temporary.
- You may change ci-auto-version command line parameters. Eg. running it with --verbose or -vb , will give more information about the on going process, exposing git commands and their results into the pipeline terminal.
- If you would like to use latest version of ci-auto-version, you may prefer to install it without version suffix as npm install ci-auto-version. However, it is safer to change version manually after a new release has been published and tested.

##### Running Pipeline with Environment Variables

- **ci-auto-version** uses $CI_AUTO_VERSION environment varible to pass arguments pefore running the pipeline manually. 
- Please pass the arguments into $CI_AUTO_VERSION environment varible as string like   --force --verbose , or  -ft -vb   one line string.
- Run the pipeline manually.

**Example Usage:** 

_Force update existing tags :_ 
```javascript
node ./node_modules/ci-auto-version/auto_version.js --user UserName --email email@host.com --force-tag
```
OR

_Execute using sh file showing git commands and results :_ 
```sh
sh ./node_modules/ci-auto-version/auto_version.sh -us Lorem -em ipsum@example.com -vb
```

##### Command Line Options

--operation, -op [ major | minor | patch | ignore ] 
-  Definition : Defines the semver digit to increase.
-  Default Value : last_commit_message

--user-name, -us [ < UserName > | last_commit_author ] 
-  Definition : Defines username of commit to repository.
-  Default Value : last_commit_author

--email, -em [ < E-Mail > | last_commit_email ] 
-  Definition : Defines email of commit to repository.
-  Default Value : last_commit_email

--commit-message, -cm [ "< CommitMessage >" | last_commit_message ] 
-  Definition : Defines commit message of the commit to repository.
-  Default Value : last_commit_message

--force-tag, -ft         
-  Definition : Forces update tag if it already exists.
-  Default Value : false
  
--print-result, -pr      
-  Definition : Prints result of the git commands to the pipeline terminal.
-  Default Value : false

--print-command, -pd     
-  Definition : Prints git commands to the pipeline terminal.
-  Default Value : false

--print-parameters, -pp  
-  Definition : Prints run time parameters to the pipeline terminal.
-  Default Value : false

--print-arguments, -pa   
-  Definition : Prints command line arguments to the pipeline terminal.
-  Default Value : false

--print-envvar, -pe      
-  Definition : Prints environment variable content to the pipeline terminal.
-  Default Value : false

--verbose, -vb           
-  Definition : Prints all output including git commands and results to the pipeline terminal.
-  Default Value : false

--silent, -si            
-  Definition : Does not print anything rather than errors to the pipeline terminal.
-  Default Value : false

--major-pattern, -mj < PatternString > 
-  Definition : Defines commit message pattern for major version upgrade.
-  Default Value : [major]

--minor-pattern, -mp < PatternString > 
-  Definition : Defines commit message pattern for minor version upgrade.
-  Default Value : [minor]

--patch-pattern, -pp < PatternString > 
-  Definition : Defines commit message pattern for minor version upgrade.
-  Default Value : [patch]

--ignore-pattern, -gp < PatternString > 
-  Definition : Defines commit message pattern to bypass version upgrade.
-  Default Value : [ignore]

--default-action, -df [ patch | minor | major | ignore ] 
-  Definition : Defines default action when no pattern matched in commit message.
-  Default Value : patch

--skip-ci-pattern, -sp < PatternString > 
-  Definition : Defines pipeline command used in commit message, not to run pipeline.
-  Default Value : [skip CI]

--no-skip-ci, -ns        
-  Definition : Does not add skip-ci-pattern eg.[skip CI] into commit message. Pipeline runs twice but version does not change since there will be no commit on last run.
-  Default Value : false

--version-prefix, -vp < VersionPrefix > 
-  Definition : Defines string which will be added as prefix of the version in tag name. Eg. v2.3.12
-  Default Value : v

--initial-version, -vi < major >.< minor >.< patch > 
-  Definition : The initial value of version if no version tag is found and it can not be extracted from package file.
-  Default Value : 1.0.0

--package-file, -pf < PackageFileName.json > 
-  Definition : Json file in which version field will be changed.
-  Default Value : package.json

--version-field, -pv < VersionFieldName > 
-  Definition : Version field name which will be updated in package json file.
-  Default Value : version

--env-var, -ev < EnvironmentVariableName > 
-  Definition : Environment Variable name which is used to pass arguments.
-  Default Value : CI_AUTO_VERSION

--simulate, -sm          
-  Definition : Simulates write to file and git commands preventing permanent changes to the repo.
-  Default Value : false

--test-repo, -tr < TestRepoAddress > 
-  Definition : Defines remote repository changes are pushed.
-  Default Value : null

--test-folder, -tf < TestFolderName > 
-  Definition : Defines local folder where git commands are executed.
-  Default Value : null

--test-run, -test        
-  Definition : Runs in test mode where git commands are executed in local test folder and changes are pushed to test repo
-  Default Value : null

--test-message, -tm "< TestCommitMessage >" 
-  Definition : Defines commit message for test purposes from where version command is extracted.
-  Default Value : null

--create-test-commit, -ct < CommitMessage > 
-  Definition : Creates a new test commit to test versioning.
-  Default Value : null

