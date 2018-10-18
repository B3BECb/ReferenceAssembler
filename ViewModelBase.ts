namespace Framework
{
	export class ViewModelBase implements IViewModel
	{
		protected _loader : IDependenceRegistrable;

		constructor(loader: IDependenceRegistrable)
		{
			this._loader = loader;
		}

		public Initialize()
		{
		}
	}
}