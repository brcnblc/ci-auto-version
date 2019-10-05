const fs = require('fs')
const git = require('./library.js').git;
const Print = new require('./library.js').Print.prototype;
const print = function (txt){Print.print(txt)}
const versionPrefix ='v';
const initialVersion = '1.0.0';
const packageFile = './package.json';
const packageVersionField = 'version';
const envVar = 'AUTO_VERSION';


function getLatestTag(kwargs) {

  // Runs 'git describe --tags' command and return result.
  let version, describeTags;
  try{
    kwargsTmp=Object.assign({}, kwargs);
    kwargsTmp.raise_on_error = true;
    describePattern = `${versionPrefix}*.*.*`;
    describeTags = git(`describe --tags --match "${describePattern}"`, kwargsTmp).replace('\n','');

    commitPattern = `^${versionPrefix}([0-9]+)\\.([0-9]+)\\.([0-9]+)-([0-9]+)-(\\S+)`;
    versionPattern = `^${versionPrefix}([0-9]+)\\.([0-9]+)\\.([0-9]+)$`;

    versionMatch = describeTags.match(versionPattern);
    commitMatch = describeTags.match(commitPattern);
    match =  versionMatch || commitMatch;

    [ full, major, minor, patch, commit, hash ] = match

    version = `${versionPrefix}${major}.${minor}.${patch}`

    commitPropogated = commitMatch != null
    return {version, commitPropogated, commit, hash}
    }
  catch (error){
    return error
  }

}

function getVersionInfo (kwargs){

  const versionInfo = getLatestTag(kwargs)
  let {version, commitPropogated, commit, hash} = versionInfo;
  let initVersion;

  if ('error' in versionInfo){
    // If no tags found, get it from package.json
    if ('stderr' in versionInfo.error){
      if (!(versionInfo.error.stderr.includes('No names found'))){process.exit(1)}
    }
    print('No version tags found, trying to extract version information from package.json.')

    try {
      const content = fs.readFileSync(packageFile)
      packageJson = JSON.parse(content);
      version = `${versionPrefix}${packageJson[packageVersionField]}`;
      commitPropogated = true;
    }
    catch (error){
      // on error set it to default version
      commitPropogated = true;
      initVersion = true;
    }

  }
  else {
    if (commitPropogated){
      print(`Version tag found ${version} with ${commit} commit${commit > 1 ? 's' : ''}. Latest hash: ${hash}\n`)
    }

  }

  return {version , commitPropogated, initVersion, commit, hash}
}

function bumpVersion(version, operation='patch') {
// Increase semver version number

  let [ major, minor, patch ] = version.substring(1).split('.');

  switch (operation){
    case 'major' : major++ ;minor=0; patch = 0; break;
    case 'minor' : minor++ ;patch=0; break;
    case 'patch' : patch++ ;break;
  }

  return `${versionPrefix}${major}.${minor}.${patch}`;
}

function changePackageJsonVersion(version) {
  try {
    const content = fs.readFileSync(packageFile)
    packageJson = JSON.parse(content)
    packageJson[packageVersionField] = version.substring(1)

    let json = JSON.stringify(packageJson, null, 2);

    fs.writeFileSync(packageFile, json);
    print(`\n${packageFile} '${packageVersionField}' field modified succesfully as '${packageJson[packageVersionField]}'\n`)
  }
  catch (error){
    throw error
  }
}

// Change to New Version
function changeVersion(version, kwargs){
  let status = {}
  try{
    const { force_update } = kwargs

    // Latest Commit Autohor, E-Mail, Message
    const seperator = '_#_'
    const result = git (`log -1 --pretty=%an${seperator}%ae${seperator}%B`, kwargs, status)
    const [author, email, message] = result.split(seperator)

    git (`config user.name "${author}"`, kwargs, status)
    git (`config user.email "${email}"`, kwargs, status)

    // Change package.json
    changePackageJsonVersion(version)

    status = {}

    // Stage package.json
    git (`add ${packageFile}`, kwargs, status)

    // Commit
    git (`commit -m "${message}\n[skip CI]"`, kwargs, status)

    // Tag
    git (`tag ${version} ${force_update ? '-f' : ''}`, kwargs, status)

    // Push commit
    print ('Pushing changes to remote repository...')
    git ('push', kwargs, status)

    // Push Tag
    git (`push origin --tags  ${force_update ? '-f' : ''}`, kwargs, status)


    if (status['error']){
      process.exit(1)
    } else {
      print('\nDone.')
    }

  }
  catch ( error ) {  
    process.exit(1)
  }
}

function evaluateVersion(operation='patch', user, email, kwargs) {
// Evaluate current version and Bump
  const versionInfo = getVersionInfo(kwargs);
  const { version,  commitPropogated, initVersion } = versionInfo;

  // If ccommitPropogated then there is a commit after latest versioning.
  if (commitPropogated){

    // Check Bump operation to be either 'major', 'minor' or 'patch'.
    if (!['major', 'minor','patch'].includes(operation.toLowerCase())) {
      print(`Operation '${operation}' undefined.`);
      process.exit(1);
    }

    // Extract operation from commit message
    const commitMessage = git (`log -1 --pretty=%B`, {print_command : false, print_stdout : false})
    const pattern = '<-(\\S+)->'
    match = commitMessage.match(pattern)
    if (match){
      command = match[1]
      if (['major', 'minor','patch'].includes(command.toLowerCase())){
        operation = command;
      }
    }

    //Get user email from CLI
    if (user){
      git (`config user.name "${user}"`, {print_command : false, print_stdout : false})
    }

    if (email){
      git (`config user.name "${email}"`, {print_command : false, print_stdout : false})
    }


    if (!initVersion) {
      //Bump Version
      newVersion = bumpVersion (version, operation)
      print (`${operation} bumping from old version ${version} to new version ${newVersion}`)
    } else {
      print(`Version info could not extracted from ${packageFile}, assigning default ${versionPrefix}${initialVersion}`)
      newVersion = `${versionPrefix}${initialVersion}`;
    }

    //Change Version
    changeVersion(newVersion, kwargs)
  }

  // There is no commit after latest versioning. Do Nothing.
  else {
    print (`No commit after latest version ${version}`)
  }
}

function argParse (args) {
  if (!args) return {};

  paramArgs = { operation : 'operation', user : 'user', email : 'email'};

  booleanArgs = {force_update : 'force', raise_on_error : '!ignore',  print_stdout : 'result',
    print_command : 'command', verbose : 'verbose', silent : 'silent', help : 'help', dryrun: 'dryrun' }

  const kwargs = {};
  let cnt = 0;
  // Iterate for all arguents
  for (let i=0; i < args.length ; i++) {
    const arg = args[i];
    if (arg == ''){cnt++ ; continue;}
    if (!(arg[0] == '-' || arg.substr(0,2) == '--')) continue;

    //Parameter Args
    for (let key in paramArgs) {
      let value = paramArgs[key];

      if ( value == arg.substring(2) || (value[0] == arg[1] && arg.length == 2)){
        let paramValue;
        try {paramValue = args[i + 1]}catch (err){print(err);process.exit(1)}
        if (paramValue) { kwargs[key] = paramValue }
        delete paramArgs[key];
        cnt += 2;
        break;
      }
    }

    //Boolean Args
    for (let key in booleanArgs) {
      let value = booleanArgs[key], reverse;

      if (value[0] == '!'){
        value = value.substring(1);
        reverse = true;
      }

      if (value == arg.substring(2) || (value[0] == arg[1] && arg.length == 2)){
          kwargs[key] = !reverse ? true : false;
          cnt++ ;
      }
    }
  }

  //Throw error on wron argument
  if (cnt != args.length){
    throw ('Argument Error')
  }

  return kwargs;
}

function printHelp(kwargs) {
  const helpText = `
  Automatic Versioning for Continuous Integration Pipelines

  --operation, -o major | minor | patch      Defines the semver digit to increase. Default: patch
  --user, -u <UserName>   Defines username of commit to repository. Default: Latest Commit User
  --email, -e <E-mail>    Defines email of commit to repository. Default: Latest Commit Email
  --force-update, -f     Forces update tag if it already exists. Default: false
  --print-result, -r    Prints result of the git commands to the pipeline terminal. Default : false
  --print-command, -c   Prints git commands to the pipeline terminal. Default : false
  --ignore-error, -i    Ignores errors and continue process with next command. Default: false (Not Recomended)
  --verbose, -v   Prints every output to the pipeline termial. Default: false
  --silent, -s    Does not produce any output to the pipeline terminal. Default: false

  Example Usage: (Assuming scripts are in .devops folder)

  Force update existing tags:

  node ./node_modules/ci-auto-version/auto_version.js --user UserName --email email@host.com -force

  OR

  Execute using sh file showing git commands and results :

  sh ./node_modules/ci-auto-version/auto_version.sh -u Lorem -e ipsum@example.com -v

  `
  print(helpText)
}

function run (arg) {
  // Get command line arguments
  let args = process.argv.slice(2);
  if (args.length == 0){
    args = arg;
  }

  //Parse Args
  let kwArgs = {};
  try {kwArgs = argParse(args);}
  catch (err){
    print(err);
    if (err == 'Argument Error'){
      print(`Check Command Line Options :`);
      print(`${arg.join(' ')}`);
      process.exit(1);
    }
  }

  //Environment Variable
  const envVarArguments = process.env[envVar]
  if (envVarArguments){
    let envArgs = {};
    try {envArgs = argParse(envVarArguments.split(' '));}
    catch (err){
      print(err);
      if (err == 'Argument Error'){
        print(`Check $${envVar} Environment Variable :`);
        print(`${envVarArguments}`);
        ;process.exit(1);
      }
    }
    // Overwrite environment arguments over command line arguments
    for (let [key, value] of Object.entries(envArgs)){
      kwArgs[key] = value;
    }
  }

  //Verbose
  if (kwArgs['verbose'] &! kwArgs['silent']) {
    kwArgs['print_stdout'] = true;
    kwArgs['print_command'] = true;
  }

  //Silent
  Print.silent = kwArgs['silent']

  if (kwArgs['help']){
    printHelp(kwArgs);
    process.exit(1);
  }

  else {
    // Call Versining Function
    evaluateVersion(
      operation= 'operation' in kwArgs ? kwArgs.operation : 'patch' , // Default value 'patch'
      user= 'user' in kwArgs ? kwArgs.user : null , // Default value null
      email= 'email' in kwArgs ? kwArgs.email : null , // Default value null
      kwargs={
        force_update: 'force_update' in kwArgs ? kwArgs.force_update : false , // Default value false
        raise_on_error: 'raise_on_error' in kwArgs ? kwArgs.raise_on_error : true , // Default value true
        print_stdout: 'print_stdout' in kwArgs ? kwArgs.print_stdout : false , // Default value false
        print_command: 'print_command' in kwArgs ? kwArgs.print_command : false , // Default value false
      });
  }
}

module.exports = run;

const __name__ = process.argv[1].split('/').pop();

if (__name__ == 'auto_version.js'){

  if (process.argv.length > 2){
    run(process.argv.slice(2))
  } else {
    run(''.split(' '))
  }

}