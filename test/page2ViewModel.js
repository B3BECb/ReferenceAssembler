a.RegisterView("test/page21View.html")
 .WithViewModel("test/page21ViewModel.js")
 .AsType(RegistrationTypes.Page)
 .RegisterView("test/page22View.html")
 .WithViewModel("test/page22ViewModel.js")
 .AsType(RegistrationTypes.Page)
 .ApplySequence();