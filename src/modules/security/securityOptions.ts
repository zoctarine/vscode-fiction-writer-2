import {Options} from "../../core/options/options";

export class SecurityOptions extends Options {
	public static readonly SectionName = 'security';

	public encryptTemporaryFilesEnabled = this.valueOf('encrypt.temporaryFies.enabled', true, true);
	public globalPassword = this.valueOf('encrypt.globalPassword', "password");

	constructor() {
		super(SecurityOptions.SectionName);

		this.refresh(); // Do a refresh before registering the change event,
		// so we don't trigger the event on the initial load.
	}
}