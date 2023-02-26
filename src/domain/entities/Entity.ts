
export default abstract class Entity {
	validate() {
		let value: any = null;
		let valid = false;
		let errors: Error | null = null;

		if (this instanceof Entity) {
			valid = true;
			value = { ...this };
		}
		else {
			errors = new Error('Invalid Entity');
		}

		return { value, valid, errors };
	}
}
