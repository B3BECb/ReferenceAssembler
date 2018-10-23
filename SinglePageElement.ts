namespace Framework
{
	export class SinglePageElement<T extends IViewModel>
		implements ISinglePageElement<T>
	{
		public Fragment: DocumentFragment;
		public IsActive: boolean;
		public ViewModel: T;

		constructor()
		{
			
		}
	}
}