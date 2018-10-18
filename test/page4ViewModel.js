a.RegisterScript("./coreTest/functions1.js")
 .RegisterScript("./coreTest/functions2.js")
 .RegisterScript("./coreTest/functions3.js")
 .ApplySequence(true);

a.RegisterScript("./coreTest/functions4.js")
 .RegisterScript("./coreTest/functions5.js")
 .ApplySequence(false);