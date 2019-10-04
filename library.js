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
function git(args, kwargs, status ){
  const keywordArgs = { raise_on_error : true, print_stdout : true,  print_command : false}
  for (k in kwargs){
    keywordArgs[k] = kwargs[k]
  }
  const { raise_on_error, print_stdout, print_command } = keywordArgs;
  const processOptions = {encoding: 'ascii', shell:true}

  if (print_command){
    console.log(`Command : git ${args}\n`)
  }

  try{

    result = run(`git ${args}`, processOptions)

    printStd(result, keywordArgs)

    return result['stdout']
  }
  catch (error) {
   printStd(error, raise_on_error)
    if(error['status'] != 0 && raise_on_error){
      throw {error}
    }
  }
}

function printStd(obj, kwargs){
  const { raise_on_error, print_stdout } = kwargs;
  if (print_stdout && (obj['stdout'] || obj['stderr'])){
    if (obj['stdout']){
      console.log(`Result : ${obj['stdout']}`)
    }
    if (obj['stderr']){

      if (obj['status'] != 0 && raise_on_error){
        console.log(`Error : ${obj['stderr']}`)
        throw {stderr: obj['stderr']}
      }
      else {
        console.log(`Info : ${obj['stderr']}`)
      }
    }
  }
}

module.exports = { git, run, Print }