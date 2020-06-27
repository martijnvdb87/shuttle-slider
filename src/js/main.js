(function () {
    var mode;
    var mainElement;
    var contentElement;
    var childrenElements;

    var isPointerDown = false;
    var pointerStartX = 0;
    var pointerStartY = 0;
    var isDragging = false;
    var dragMargin = 3;

    var startDragX = 0;
    var startDragY = 0;

    var startTranslateX = 0;
    var startTranslateY = 0;

    function init() {
        setEvents();
    }


    function getElement(e) {
        var target = false;
        var current = e.target;
        while (current.parentNode) {
            if (current.dataset && typeof current.dataset.shuttleSlider !== 'undefined') {
                target = current;
                break;
            }
            current = current.parentNode;
        }

        return target;
    }

    function getElementContent() {
        if (!mainElement) return;

        if (mainElement.children && mainElement.children.length > 0) {
            return mainElement.children[0];
        }
    }

    function getElementChildren() {
        if (!mainElement || !contentElement) return;

        if (contentElement.children && contentElement.children.length > 0) {
            return Array.prototype.slice.call(contentElement.children);
        }
    }

    function getMode() {
        if (!mainElement) return;

        switch (mainElement.dataset.shuttleSlider) {
            case 'x':
            case 'y':
                return mainElement.dataset.shuttleSlider;
        }

        return 'both';
    }

    function getCursorPosition(e, type) {
        if (type == 'x') {
            return e.pageX || (e.touches && e.touches[0] && e.touches[0].pageX) || 0;
        }

        if (type == 'y') {
            return e.pageY || (e.touches && e.touches[0] && e.touches[0].pageY) || 0;
        }

        return;
    }

    function getTranslate(type) {
        var targetRect = mainElement.getBoundingClientRect();
        var contentRect = contentElement.getBoundingClientRect();

        if (type == 'x') {
            return contentRect.x - targetRect.x;
        }

        if (type == 'y') {
            return contentRect.y - targetRect.y;
        }

        return;
    }


    function setEvents() {
        document.addEventListener('mousedown', pointerDown);
        document.addEventListener('touchstart', pointerDown);

        document.addEventListener('mousemove', pointerMove);
        document.addEventListener('touchmove', pointerMove);

        document.addEventListener('mouseup', pointerUp);
        document.addEventListener('touchend', pointerUp);
    }

    function pointerDown(e) {
        mainElement = getElement(e);

        if (!mainElement) return;

        isPointerDown = true;

        contentElement = getElementContent();
        childrenElements = getElementChildren();
        mode = getMode();

        pointerStartX = getCursorPosition(e, 'x');
        pointerStartY = getCursorPosition(e, 'y');

        mainElement.setAttribute('data-shuttle-scroll-holding', '');
    }

    function pointerMove(e) {
        if (!isPointerDown) return;

        var offsetX = getCursorPosition(e, 'x') - pointerStartX;
        var offsetY = getCursorPosition(e, 'y') - pointerStartY;

        if (
            !isDragging && (
                offsetX > dragMargin ||
                offsetX < dragMargin * -1 ||
                offsetY > dragMargin ||
                offsetY < dragMargin * -1
            )
        ) {
            isDragging = true;
            startDragX = getCursorPosition(e, 'x');
            startDragY = getCursorPosition(e, 'y');

            startTranslateX = getTranslate('x');
            startTranslateY = getTranslate('y');

            mainElement.setAttribute('data-shuttle-scroll-dragging', '');
        }

        if (!isDragging) return;

        var dragX = getCursorPosition(e, 'x') - startDragX;
        var dragY = getCursorPosition(e, 'y') - startDragY;

        var translateX = startTranslateX;
        var translateY = startTranslateY;

        if (mode == 'x' || mode == 'both') {
            translateX += dragX;
        }

        if (mode == 'y' || mode == 'both') {
            translateY += dragY;
        }

        contentElement.style.transform = 'translate(' + translateX + 'px, ' + translateY + 'px)';


    }

    function pointerUp(e) {
        if (!isPointerDown) return;

        isPointerDown = false;
        isDragging = false;
        mainElement.removeAttribute('data-shuttle-scroll-dragging');
        mainElement.removeAttribute('data-shuttle-scroll-holding');
    }

    init();
})();