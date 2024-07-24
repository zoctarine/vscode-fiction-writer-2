interface Entry {
    id: string;
    order: number;
}
export class OrderHandler {
    // Helper function to convert a decimal number to a base36 string
    public  static toBase36(number:number) {
        return number.toString(36).toUpperCase();
    }
    public static toBase10(base36Str:string) {
        return parseInt(base36Str, 36);
    }

    private fileNumbers:Entry[] = [];
    public static gap = 100000;

    constructor(fileNumbers:Entry[]) {
        this.fileNumbers = fileNumbers;
    }

    public insertAfter(afterId:string, currentId:string) {
        const index = this.fileNumbers.findIndex(a => a.id === afterId);

        if (this.to(index + 1) - this.from(index) <= 1) {
            this.redistribute(index + 1);
        }

        let nextOrder =  Math.floor(
            (this.from(index) + this.to(index + 1)) / 2);

        if (index>=this.fileNumbers.length-1){
            nextOrder = Math.max(nextOrder, (this.fileNumbers.length +1) * OrderHandler.gap);
        }
       this.fileNumbers.splice(index + 1, 0, {
            order: nextOrder,
            id: currentId
        });

    }
    public from(index:number) {
        return index < 0
            ? 0
            : this.fileNumbers[index].order;
    }

    public to(index:number) {
        if (index < 0 || index >= this.fileNumbers.length) {
            return this.from(index-1) + OrderHandler.gap;
        }

        return this.fileNumbers[index].order;
    }

    public redistribute(index:number) {
        if (this.to(index + 1) - this.from(index) <= 1) {
            this.redistribute(index + 1);
        }

        this.fileNumbers[index].order = Math.floor(
            (this.from(index) + this.to(index + 1)) / 2);
    }

    public move(currentId:string, afterId:string) {
        const current = this.fileNumbers.findIndex(a => a.id === currentId);
        const after = this.fileNumbers.findIndex(a => a.id === afterId);
        this.fileNumbers.splice(current, 1);
        this.insertAfter(afterId, currentId);
    }

    public get():Entry[]{
        return this.fileNumbers;
    }
}