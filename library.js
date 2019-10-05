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
    if (result['stderr'] && result['status'] != 0){throw result}
    if (print_stdout){
      console.log(`Result : ${result['stdout']}`)
      console.log(result['stderr'])
    }
 
    return result['stdout']
  }
  catch (error) {

   console.log(error['stderr'])
    if(raise_on_error){
      throw {error}
    }
  }
}



module.exports = { git, run, Print }