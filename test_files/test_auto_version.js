const auto_version = require('../auto_version');
let testRun = process.argv.slice(2).join(' ') + ' --create-test-commit " test " --test-run --verbose --test-folder test_folder --test-repo https://github.com/brcnblc/test_ci_auto_version.git';
auto_version(testRun)