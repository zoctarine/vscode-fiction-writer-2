interface Entry {
    id: string;
    order: number;
}

export class OrderHandler {
    public static toBase36(number: number) {
        return number.toString(36).toUpperCase();
    }

    public static toBase10(base36Str: string) {
        return parseInt(base36Str, 36);
    }

    private fileNumbers: Entry[] = [];
    public static gap = 10000;

    constructor(fileNumbers: Entry[]) {
        this.fileNumbers = fileNumbers;
    }

    public insertAfter(afterId: string, currentId: string) {
        const index = this.fileNumbers.findIndex(a => a.id === afterId);

        if (this.to(index + 1) - this.from(index) <= 1) {
            this.redistribute(index + 1);
        }

        let nextOrder = Math.floor(
            (this.from(index) + this.to(index + 1)) / 2);

        if (index > this.fileNumbers.length - 1) {
            nextOrder = this.computeNextLastGap();
        }
        this.fileNumbers.splice(index + 1, 0, {
            order: nextOrder,
            id: currentId
        });

    }

    public insertBefore(beforeId: string, currentId: string) {
        const index = this.fileNumbers.findIndex(a => a.id === beforeId) - 1;
        if (index < -1) {
            this.fileNumbers.splice(index + 1, 0, {
                order: this.computeNextLastGap(),
                id: currentId
            });
            return;
        }

        if (this.to(index + 1) - this.from(index) <= 1) {
            this.redistribute(index + 1);
        }

        let nextOrder = Math.floor(
            (this.from(index) + this.to(index + 1)) / 2);

        if (index > this.fileNumbers.length - 1) {
            nextOrder = this.computeNextLastGap();
        }
        this.fileNumbers.splice(index + 1, 0, {
            order: nextOrder,
            id: currentId
        });
    }


    public from(index: number) {
        return index < 0
            ? 0
            : this.fileNumbers[index].order;
    }


    public computeNextLastGap() {
        const count = this.fileNumbers.length;
        if (count === 0) {
            return OrderHandler.gap;
        }
        return Math.max(this.fileNumbers[count - 1].order + OrderHandler.gap / 2, (count) * OrderHandler.gap);
    }

    public to(index: number) {
        if (index < 0 || index >= this.fileNumbers.length) {
            return this.from(index - 1) + OrderHandler.gap;
        }

        return this.fileNumbers[index].order;
    }

    public redistribute(index: number) {
        if (index >= this.fileNumbers.length) {
            return;
        }

        if (this.to(index + 1) - this.from(index) <= 1) {
            this.redistribute(index + 1);
        }

        this.fileNumbers[index].order = Math.floor(
            (this.from(index) + this.to(index + 1)) / 2);
    }

    public reorder(currentId: string, targetId: string) : OrderHandler{
        const current = this.fileNumbers.findIndex(a => a.id === currentId);
        const target = this.fileNumbers.findIndex(a => a.id === targetId);
        this.fileNumbers.splice(current, 1);

        // to give the impression we are replacing the item we dropped the item on,
        // we insert the item before the target, if the current item comes from below the target
        // and after the target if the current item comes from above the target
        if (current > target || target === 0) {
            this.insertBefore(targetId, currentId);
        } else {
            this.insertAfter(targetId, currentId);
        }

        return this;
    }

    public redistributeAll() : OrderHandler {
        for (let i = 0; i < this.fileNumbers.length; i++) {
            this.fileNumbers[i].order = (i+1) * OrderHandler.gap;
        }
        return this;
    }
    public get(): Entry[] {
        return this.fileNumbers;
    }
}