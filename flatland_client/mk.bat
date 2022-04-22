:call babel.cmd build.js -o build6.js
call rollup.cmd -c
call babel.cmd build.js -o build6.js

:call babel.cmd flatland.js -o build6a.js

set WARN_DISABLE=
set WARN_DISABLE=%WARN_DISABLE% --jscomp_off suspiciousCode
set WARN_DISABLE=%WARN_DISABLE% --jscomp_off globalThis
set WARN_DISABLE=%WARN_DISABLE% --jscomp_off functionParams
set WARN_DISABLE=%WARN_DISABLE% --jscomp_off uselessCode
set WARN_DISABLE=%WARN_DISABLE% --jscomp_off missingReturn
set WARN_DISABLE=%WARN_DISABLE% --jscomp_off strictMissingProperties
set WARN_DISABLE=%WARN_DISABLE% --jscomp_off missingProperties
set WARN_DISABLE=%WARN_DISABLE% --jscomp_off checkTypes
:globallyMissingProperties

echo call google-closure-compiler.cmd %WARN_DISABLE% --compilation_level ADVANCED_OPTIMIZATIONS  --language_out "ECMASCRIPT_2016"  --js=build6.js --js_output_file=build.min.js
:call google-closure-compiler.cmd %WARN_DISABLE% --compilation_level ADVANCED_OPTIMIZATIONS  --language_out "ECMASCRIPT_2016"  --js=build6.js --js_output_file=build.min.js
call google-closure-compiler.cmd %WARN_DISABLE% --compilation_level ADVANCED_OPTIMIZATIONS   --js=build6.js --js_output_file=build.min.js
