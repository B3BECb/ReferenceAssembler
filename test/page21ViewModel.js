class Page21ViewModel extends Framework.ViewModelBase {
    constructor(loader) {
        super(loader);
    }
    Initialize() {
        this._loader
            .RegisterScript('')
            .ApplyRegistrations()
            .RegisterHtml('')
            .WithName('')
            .WithScript('')
            .AsType(Framework.RegistrationTypes.Page)
            .ApplyRegistrations()
            .Resolve();
    }
}
//# sourceMappingURL=page21ViewModel.js.map