const auto_version = require('../auto_version');
let testRun = '' + ' --test-run --show-args --test-folder test_folder --test-repo https://github.com/brcnblc/test_ci_auto_version.git';
auto_version(testRun)