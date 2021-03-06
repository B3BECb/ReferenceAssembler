namespace Framework
{
	export class ViewModelBase
		extends Emitter
		implements IViewModel
	{
		protected _loader : IDependenceRegistrable;

		constructor(loader: IDependenceRegistrable)
		{
			super();

			this._loader = loader;
		}

		public async Initialize()
		{
		}
	}
}