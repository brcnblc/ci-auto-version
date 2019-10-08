const fs = require('fs')
const {git, escapeRegExp} = require('./library');
const Print = require('./library').Print.prototype;
const print = function (txt){Print.print(txt)}
const argParse = require('./argParse');
const argDefinitions = require('./arguments.json');
const statList = [];


function getLatestTag(kwargs) {

  // Runs 'git describe --tags' command and return result.
  let version, describeTags;
  try{
    kwargsTmp=Object.assign({}, kwargs);
    kwargsTmp.raise_on_error = true;
    describePattern = `${kwargs.version_prefix}*.*.*`;
    describeTags = git(`describe --tags --match "${describePattern}"`, kwargsTmp, statList, kwargs.simulate).replace('\n','');

    commitPattern = `^${kwargs.version_prefix}([0-9]+)\\.([0-9]+)\\.([0-9]+)-([0-9]+)-(\\S+)`;
    versionPattern = `^${kwargs.version_prefix}([0-9]+)\\.([0-9]+)\\.([0-9]+)$`;

    versionMatch = describeTags.match(versionPattern);
    commitMatch = describeTags.match(commitPattern);
    match =  versionMatch || commitMatch;

    [ full, major, minor, patch, commit, hash ] = match

    version = `${kwargs.version_prefix}${major}.${minor}.${patch}`

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
  let initVersion, processTagOnly;

  if ('error' in versionInfo){
    // If no tags found, get it from package.json
    if ('stderr' in versionInfo.error){
      if (!(versionInfo.error.stderr.includes('No names found'))){process.exit(1)}
    }
    print('No version tags found, trying to extract version information from package.json.')

    try {
      const content = fs.readFileSync(kwargs.package_file)
      packageJson = JSON.parse(content);
      version = `${kwargs.version_prefix}${packageJson[kwargs.package_version_field]}`;
      commitPropogated = !git('status', kwargs, statList, true).includes('nothing to commit, working tree clean');
      processTagOnly = true;
    }
    catch (error){
      // on error set it to default version
      commitPropogated = !git('status', kwargs, statList, true).includes('nothing to commit, working tree clean');
      initVersion = true;
      processTagOnly = true;
    }

  }
  else {
    if (commitPropogated){
      print(`Version tag found ${version} with ${commit} commit${commit > 1 ? 's' : ''}. Latest hash: ${hash}\n`)
    }

  }

  return {version , commitPropogated, initVersion, commit, hash, processTagOnly}
}

function bumpVersion(version, kwargs) {
// Increase semver version number

  let [ major, minor, patch ] = version.substring(1).split('.');

  switch (kwargs.operation){
    case 'major' : major++ ;minor=0; patch = 0; break;
    case 'minor' : minor++ ;patch=0; break;
    case 'patch' : patch++ ;break;
  }

  return `${kwargs.version_prefix}${major}.${minor}.${patch}`;
}

function changePackageJsonVersion(version, kwargs) {
  try {
    const content = fs.readFileSync(kwargs.package_file)
    packageJson = JSON.parse(content)
    packageJson[kwargs.package_version_field] = version.substring(1)

    let json = JSON.stringify(packageJson, null, 2);

    fs.writeFileSync(kwargs.package_file, json);
    print(`\n${kwargs.package_file} '${kwargs.package_version_field}' field modified succesfully as '${packageJson[kwargs.package_version_field]}'\n`)
  }
  catch (error){
    throw error
  }
}

function comparePackageJsonVersion(version, kwargs){
  try {
    const content = fs.readFileSync(kwargs.package_file)
    packageJson = JSON.parse(content)
    let versionSame = packageJson[kwargs.package_version_field] == version.substring(1)
    if (versionSame){
      print(`\n${kwargs.package_file} '${kwargs.package_version_field}' field same as version '${version}'\n`)
    }
    return versionSame
  }
  catch (error){
    throw error
  }
}

// Change to New Version
function changeVersion(version, kwargs){
  
  try{
    // Last Commit Autohor, E-Mail, Message
    const seperator = '_#_'
    const result = git (`log -1 --pretty=%an${seperator}%ae${seperator}%B`, kwargs, statList, kwargs.simulate)
    const [lastCommitAuthor, lastCommitEmail, lastCommitMessage] = result.split(seperator)
    
    const user = kwargs.user == 'last_commit_author' ? lastCommitAuthor : kwargs.user;
    git (`config user.name "${user}"`, kwargs, statList)

    const email = kwargs.email == 'last_commit_email' ? lastCommitEmail : kwargs.email;
    git (`config user.email "${email}"`, kwargs, statList)

    // Change package.json
    const sameVersion = comparePackageJsonVersion(version, kwargs);
    
    if (!sameVersion) {
      if (kwargs.simulate) {
        print(`simulate call to changePackageJsonVersion(${version})`)
      } else {
        changePackageJsonVersion(version, kwargs)

        // Stage package.json
        git (`add ${kwargs.package_file}`, kwargs, statList)
        
        // Commit
        let commitMessage = kwargs.commit_message == 'last_commit_message' ? lastCommitMessage : kwargs.commit_message;
        if (kwargs.skip_ci){
          commitMessage = `${commitMessage}\n${kwargs.skip_ci_pattern}`
        }
        git (`commit -m "${commitMessage}"`, kwargs, statList)
      }
      } 

    // Tag
    const { force_update } = kwargs
    git (`tag ${version}${force_update ? ' -f' : ''}`, kwargs, statList)
    
    // Test
    if (kwargs.test_run){
      // Set test remote 
      git (`remote set-url --push origin ${kwargs.test_repo}`,kwargs, statList)
      // Push test commit
      let geturl = git (`remote get-url origin`, kwargs, statList)
      print (`Pushing changes to remote test repository ${geturl}`)
      git ('push -u origin master', kwargs, statList)
      // Push Test Tag
      git (`push origin --tags${force_update ? ' -f' : ''}`, kwargs, statList)

    } else {
      // Push commit
      let geturl = git (`remote get-url origin`, kwargs, statList)
      print (`Pushing changes to remote repository ${geturl}`)
      git ('push -u origin master', kwargs, statList)

      // Push Tag
      git (`push origin --tags${force_update ? ' -f' : ''}`, kwargs, statList)
    }

    // Print Complete
    print('Operation Complete.')
    
  }
  catch ( error ) {  
    console.error(error, error.stack.split('\n')[1])
    process.exit(1)
  }
}

function evaluateVersion(kwargs) {
// Evaluate current version and Bump
  const versionInfo = getVersionInfo(kwargs);
  const { version,  commitPropogated, initVersion, processTagOnly } = versionInfo;

  // If ccommitPropogated then there is a commit after latest versioning.
  if (commitPropogated || processTagOnly ){

    // Extract operation from commit message
    if (kwargs.operation == 'last_commit_message' || kwargs.test_message){
      const commitMessage = kwargs.test_message ? kwargs.test_message : git (`log -1 --pretty=%B`, kwargs, statList, true);
      if (commitMessage.match(escapeRegExp(kwargs.major_pattern))){kwargs.operation = 'major';}
      else if (commitMessage.match(escapeRegExp(kwargs.minor_pattern))){kwargs.operation = 'minor';}
      else if (commitMessage.match(escapeRegExp(kwargs.patch_pattern))){kwargs.operation = 'patch';}
      else if (commitMessage.match(escapeRegExp(kwargs.ignore_pattern))){kwargs.operation = 'ignore';}
      else {
        kwargs.operation = kwargs.default_action;
      }

      if (kwargs.operation == 'ignore'){
        print(`Found ${kwargs.ignore_pattern} pattern in commit message. Auto Versioning has been cancelled.`);
        process.exit(0)
      }

      
    }

    if (!initVersion &! processTagOnly) {
      //Bump Version
      newVersion = bumpVersion (version, kwargs)
      print (`Opereration '${kwargs.operation}' from old version ${version} to new version ${newVersion}`)
    } else if (initVersion){
      print(`Version info could not extracted from ${kwargs.package_file}, assigning default ${kwargs.version_prefix}${kwargs.initial_version}`)
      newVersion = `${kwargs.version_prefix}${kwargs.initial_version}`;
    } else {
      print(`Version info extracted from ${kwargs.package_file}, as ${version}`)
      newVersion = `${version}`;
    }

    //Change Version
    changeVersion(newVersion, kwargs)
    
    
  }

  // There is no commit after latest versioning. Do Nothing.
  else {
    print (`No commit after latest version ${version}`)
  }
}

function run (argString) {
  // Get command line arguments
  let args = process.argv.slice(2);
  if (args.length > 0){
    argString = args.join(' ');
  }

  //Parse Args
  let kwArgs = {};
  try {kwArgs = argParse(argString, argDefinitions);}
  catch (err){
    print(err);
    print(`Check Command Line Options :`);
    print(`${argString}`);
    process.exit(1);
    
  }

  //Environment Variable
  const envVarArguments = process.env[kwArgs.env_var]
  if (envVarArguments){
    let envArgs = {};
    try {envArgs = argParse(envVarArguments, argDefinitions);}
    catch (err){
      print(err);
      if (err == 'Argument Error'){
        print(`Check $${kwArgs.env_var} Environment Variable :`);
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

  // Test
  if (kwArgs.test_run){
    if (kwArgs.test_repo && kwArgs.test_folder){
      try {process.chdir(kwArgs.test_folder);}
      catch (error){
        console.error(error)
        process.exit(1)
      }
      
      
    } else {
      console.error ('test_repo and test_folder should be assigned.');
      process.exit(1);
    }
  }
  // Call Versining Function
  evaluateVersion(kwArgs);
  
}

module.exports = run;

const __name__ = process.argv[1].split('/').pop();

if (__name__ == 'auto_version.js'){
  print(`Process : ${process.argv[1]}`)
  if (process.argv.length > 2){
    run(process.argv.slice(2).join(' '))
  } else {
    run()
  }
}

