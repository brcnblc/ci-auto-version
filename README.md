# ci-auto-version
###  Automatic Versioning for Continuous Integration Pipelines

###### Command Line Options
-  --operation, -o major | minor | patch      Defines the semver digit to increase. Default: patch
-  --user, -u <UserName>   Defines username of commit to repository. Default: Latest Commit User
-  --email, -e <E-mail>    Defines email of commit to repository. Default: Latest Commit Email
-  --force-update, -f     Forces update tag if it already exists. Default: false
-  --print-result, -r    Prints result of the git commands to the pipeline terminal. Default : false
-  --print-command, -c   Prints git commands to the pipeline terminal. Default : false
-  --ignore-error, -i    Ignores errors and continue process with next command. Default: false
-  --verbose, -v   Prints every output to the pipeline termial. Default: false
-  --silent, -s    Does not produce any output to the pipeline terminal. Default: false

**Example Usage:** _(Assuming scripts are in .devops folder)_

_Force update existing tags:_

```javascript
node ./node_modules/ci-auto-version/auto_version.js --user UserName --email email@host.com -force
```
_OR_

_Execute using sh file showing git commands and results :_
```javascript
sh ./node_modules/ci-auto-version/auto_version.sh -u Lorem -e ipsum@example.com -v
```