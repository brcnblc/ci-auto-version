function parse (argStr, argDefs) {
  if (!argStr) return {};
  
  if (!argDefs) {throw('No Argument Definition provided.')}
  const args = evalStrings(argStr)
  let cnt = 0;
  if (args.includes('--show-args') || args.includes('-sa')){console.log('Arguments : ',args);cnt++}
  if (args.includes('--help') || args.includes('-h')){
    console.log(helpText(argDefs));
    process.exit(1);
  }
  const kwargs = {};
  
  //Assign Default Values
  for (let key in argDefs.arguments) {
    let argument = argDefs.arguments[key]; 
    if ('defaultValue' in argument){
      kwargs[argument.variableName] = argument.defaultValue;
    }
  }

  // Iterate for all arguents
  for (let i=0; i < args.length ; i++) {
    const arg = args[i];
    if (arg == ''){cnt++ ; continue;}
    const isLongArgument = arg.substr(0,2) == '--'
    if (!(arg[0] == '-' || isLongArgument)) continue;

    //Search Args
    for (let key in argDefs.arguments) {
      let argument = argDefs.arguments[key];
      
      if (isLongArgument && argument.longCommand == arg.substring(2) ||
          !isLongArgument && argument.shortCommand == arg.substring(1)){
        if (argument.type == 'parameter'){
          let paramValue;
          try {paramValue = args[i + 1]}catch (err){throw err}
          if (paramValue) { 
            kwargs[argument.variableName] = paramValue 
            cnt += 2;
          } else {
            throw (`Argument ${argument.longCommand} should have a value ${argument.usage}.`)
          }
        } else if (argument.type == 'boolean'){
          kwargs[argument.variableName] = !argument.reverse ? true : false;
          cnt++
        } else {
          throw('Wrong Argument Definition.');
        }
        
        delete argument[key];
        break;
      } 
    }

  }

  //Throw error on wrong argument
  if (cnt != args.length){
    throw ('Could not handle All Arguments.')
  }

  return kwargs;
}

function helpText(argDefs) {
  let htxt = `${argDefs.title}\n\n`
  htxt += Object.entries(argDefs.arguments).reduce((previous, current, index) => {
      let line = `--${current[1].longCommand}, -${current[1].shortCommand}`
      let usage = current[1].usage;
      if (Array.isArray(usage)){
        usage = ' [ ' + usage.join(' | ') + ' ] '
      } else if (usage == null) {
        let space = 25
        usage = ' '.repeat((space - line.length) > 0 ? space - line.length : 5)
      } else {
        usage = ' ' + usage + ' '
      }
      
      return `${previous}${line}${usage}\n  ${current[1].definition}\n\n`
    }, '')

    htxt += '\nExamples: \n\n'
    htxt += Object.entries(argDefs.examples).reduce((previous, current, index) => {
      return `${previous}${current[1].title} : \n${current[1].example}\n\n`
    },'')
  return htxt
}

function evalStrings(argStr){
  const arr = argStr.split(' ')
  let result = [];
  quoteOpen = false;
  for (let i=0; i<arr.length; i++) {
    
    if (arr[i].includes('"')){
      if (quoteOpen){
        if (arr[i][arr[i].length-1] == '"'){
          quoteOpen = false;
          result[result.length - 1] = `${result[result.length - 1]} ${arr[i].substr(0,arr[i].length - 1)}`
        } else {
          throw('Argument Error');
        }
      } else {
        if (arr[i][0] == '"'){
          quoteOpen = true;
          result.push(arr[i].substring(1))
        } else {
          throw('Argument Error');
        }
      }
    } else {
      if (quoteOpen){
        result[result.length - 1] = `${result[result.length - 1]} ${arr[i]}`
      } else {
        result.push(arr[i]);
      }
    }
  }
  return result;
}

module.exports = parse;