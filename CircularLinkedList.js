module.exports = function CircularLinkedList() {
    let length = 0;
    let head = null;

    function getElementAt(index)  {
        if(index >= 0 && index <= length){
            let node = head;
            for(let i = 0; i < index && node != null; i++){
                node = node.next;
            }
            return node;
        }
        return undefined;
    }
    
    function push(node) {
        let current;
        
        if(head === null){
            head = node;
        }else{
            current = getElementAt(length - 1);
            current.next = node;
        }
        
        node.next = head;
        length++;

        return node;
    }
    
    function insert(node, index) {
        if(index >= 0 && index <= length){
            let current = head;
            
            if(index === 0){            
                if(head === null){
                    head = node;
                    node.next = head;
                }else{
                    node.next = current;
                    current = getElementAt(length);
                    head = node;
                    current.next = head;
                }
            }else{
                const previous = getElementAt(index - 1);
                node.next = previous.next;
                previous.next = node;
            }
            
            length++;
            return true;
        }
        return false;
    }
    
    function removeAt(index) {
        if(index >= 0 && index < length){
            let current = head;
            
            if(index === 0){
                if(length === 1){
                    head = undefined;
                }else{
                    const removed = head;
                    current = getElementAt(length - 1);
                    head = head.next;
                    current.next = head;
                    current = removed;
                }
            }else{
                const previous = getElementAt(index - 1);
                current = previous.next;
                previous.next = current.next;
            }
            
            length--;
            return current;
        }
        return undefined;
    }
    
    function indexOf(elm) {
        let current = head,
        index = -1;

        while(current){
            if(elm === current){
                 return ++index;
            }

             index++;
             current = current.next;
         }

        return -1;
    };

    function forEach(iter) {
        let current = head;
        const temp = head

        let index = 0;
        while(current && temp !== current.next){
        	iter(current, index);
            current = current.next;
            ++index;
        }
    }
    
    function isPresent(elm) {
        return indexOf(elm) !== -1;
    };
    
    function getHead() {
        return head;
    }
    
    function remove(node) {
        let current = head;
        while(current && node !== current.next){
            current = current.next;
        }
        current.next = node.next;
        --length;
        return node;
    }; 
    
    function removeHead() {
        removeAt(0);
    }
    
    function toString() {
        let current = head,
        string = '';
        const temp = head;
        
        while(current){
            if(temp === current.next){
                string += current + (current.next ? '\n' : '');
                break;
            }
            
            string += current + (current.next ? '\n' : '');
            current = current.next;
        }

        return string;
    };
    
    function toArray() {
        let arr = [],
        current = head;
        const temp = head

        while(current){
            if(temp === current.next){
                arr.push(current);
                break;
            }
            
            arr.push(current);
            current = current.next;
        }

        return arr;
    };
    
    function isEmpty() {
        return length === 0;
    };
    
    function size() {
        return length;
    }

    return {
    	get head() { return head; },
		get length() { return length; },
		push,
		remove,
		toString,
		toArray,
		// removeHead,
		// getElementAt,
		// insert,
		// removeAt,
		// indexOf,
		// isPresent,
		// getHead,
		// isEmpty,
    }
}