const run = require('child_process').spawnSync; //Syncronous execution

class Print {
  constructor(silent){
    this.silent = silent;
  }

  print(txt){
    if (!this.silent){
      console.log(txt);
    }
  }

}

// Syncronous git function
function git(args, kwargs, status, override_simulate ){
  
  const { raise_on_error, print_stdout, print_command, simulate, silent } = kwargs;
  const processOptions = {encoding: 'ascii', shell:true}
  let result = {};

  const command = args.split(' ')[0]
  const command_has_dryrun = ['add', 'commit', 'push'].includes(command)
  if (command_has_dryrun && simulate){
    args += (' --dry-run')
  }

  if (print_command){
    console.log(`Command : git ${args}\n`)
  }


  try{
    if (!simulate || override_simulate || command_has_dryrun){
      result = run(`git ${args}`, processOptions)
    } else {
      console.log (`Simulate call : git ${args}\n`)
    }

    if (result['stderr'] && result['status'] != 0){throw result}
    if (print_stdout &! silent || (simulate && command_has_dryrun || override_simulate)){
      console.log(`Result : ${result['stdout']}`)
      console.log(result['stderr'])
      status.push({command: `git ${args}`, result: result['stdout'], error: result['stderr']})
    }
 
    return result['stdout']
  }
  catch (error) {
    status.push({command: `git ${args}`, error: error['stderr']})
    console.log(error['stderr'])
    if(raise_on_error){
      throw {error}
    }
  }
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}



module.exports = { git, run, Print, escapeRegExp }