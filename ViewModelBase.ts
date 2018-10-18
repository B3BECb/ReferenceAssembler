namespace Framework
{
	export class ViewModelBase implements IViewModel
	{
		private _loader : IDependenceRegistrable;

		constructor(loader: IDependenceRegistrable)
		{
			this._loader = loader;
		}

		public Initialize()
		{
		}
	}
}