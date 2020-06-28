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
    var dragElastic = 0.2;

    var startDragX = 0;
    var startDragY = 0;

    var startTranslateX = 0;
    var startTranslateY = 0;

    var pointerHistory = [];

    var currentPageX = 0;
    var currentPageY = 0;

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

        return 'x';
    }

    function getCursorPosition(e, type) {
        if (type == 'x') {
            return e.pageX || (e.touches && e.touches[0] && e.touches[0].pageX) || 0;
        }

        if (type == 'y') {
            return e.pageY || (e.touches && e.touches[0] && e.touches[0].pageY) || 0;
        }
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
    }

    function getMaxOffset(type) {
        childrenElements = getElementChildren();
        if (childrenElements.length > 0) {
            var mainRect = mainElement.getBoundingClientRect();

            if (type == 'x') {
                return (getContentSize('x') - mainRect.width) * -1;
            }

            if (type == 'y') {
                return (getContentSize('y') - mainRect.height) * -1;
            }
        }
    }

    function getContentSize(type) {
        childrenElements = getElementChildren();
        if (childrenElements.length > 0) {
            var contentRect = contentElement.getBoundingClientRect();
            var lastChild = childrenElements[childrenElements.length - 1].getBoundingClientRect();

            if (type == 'x') {
                return lastChild.x + lastChild.width - contentRect.x;
            }

            if (type == 'y') {
                return lastChild.y + lastChild.height - contentRect.y;
            }
        }
    }

    function intervalPointer() {
        addPointerHistory(currentPageX, currentPageY);

        setTimeout(function () {
            if (isDragging) {
                intervalPointer();
            }
        }, 10);

    }

    function addPointerHistory(x, y) {
        pointerHistory.unshift({
            x: x,
            y: y,
            timestamp: Date.now()
        });

        pointerHistory = pointerHistory.slice(0, 10);
    }

    function pointerSpeed(type) {
        if (pointerHistory.length > 0) {
            var duration = (pointerHistory[0].timestamp - pointerHistory[pointerHistory.length - 1].timestamp) / 1000;

            if (type == 'x') {
                return (pointerHistory[0].x - pointerHistory[pointerHistory.length - 1].x) / duration;
            }

            if (type == 'y') {
                return (pointerHistory[0].y - pointerHistory[pointerHistory.length - 1].y) / duration;
            }
        }

        return 0;
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
        mode = getMode();

        pointerStartX = getCursorPosition(e, 'x');
        pointerStartY = getCursorPosition(e, 'y');

        currentPageX = getCursorPosition(e, 'x');
        currentPageY = getCursorPosition(e, 'y');

        mainElement.setAttribute('data-shuttle-slider-holding', '');
    }

    function pointerMove(e) {
        if (!isPointerDown) return;

        currentPageX = getCursorPosition(e, 'x');
        currentPageY = getCursorPosition(e, 'y');

        var mainRect = mainElement.getBoundingClientRect();

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
            pointerHistory = [];
            startDragX = getCursorPosition(e, 'x');
            startDragY = getCursorPosition(e, 'y');

            startTranslateX = getTranslate('x');
            startTranslateY = getTranslate('y');

            mainElement.setAttribute('data-shuttle-slider-dragging', '');
            intervalPointer();
        }

        if (!isDragging) return;

        var dragX = getCursorPosition(e, 'x') - startDragX;
        var dragY = getCursorPosition(e, 'y') - startDragY;

        var translateX = startTranslateX;
        var translateY = startTranslateY;

        if (mode == 'x') {
            translateX += dragX;
        }

        if (mode == 'y') {
            translateY += dragY;
        }

        if (translateX < getMaxOffset('x') && !(getContentSize('x') < mainRect.width)) {
            translateX = getMaxOffset('x') + ((getMaxOffset('x') - translateX) * -1 * dragElastic);
        } else if (0 < translateX || getContentSize('x') < mainRect.width) {
            translateX *= dragElastic;
        }

        if (translateY < getMaxOffset('y') && !(getContentSize('y') < mainRect.height)) {
            translateY = getMaxOffset('y') + ((getMaxOffset('y') - translateY) * -1 * dragElastic);
        } else if (0 < translateY || getContentSize('y') < mainRect.height) {
            translateY *= dragElastic;
        }

        contentElement.style.transform = 'translate(' + translateX + 'px, ' + translateY + 'px)';
    }

    function pointerUp(e) {
        if (!isPointerDown) return;

        isPointerDown = false;

        stopDragging();
    }

    function stopDragging() {
        if (!isDragging) return;

        isPointerDown = false;
        isDragging = false;
        mainElement.removeAttribute('data-shuttle-slider-dragging');
        mainElement.removeAttribute('data-shuttle-slider-holding');

        var extraSpeedDistanceX = pointerSpeed('x') / 10000;
        var extraSpeedDistanceY = pointerSpeed('y') / 10000;

        var endTranslateX = (getTranslate('x') + extraSpeedDistanceX) * -1;
        var endTranslateY = (getTranslate('y') + extraSpeedDistanceY) * -1;

        childrenElements = getElementChildren();

        var mainRect = mainElement.getBoundingClientRect();
        var contentRect = contentElement.getBoundingClientRect();


        var translateX = 0;
        var translateY = 0;

        var foundChildX = childrenElements.find(function (child) {
            var childRect = child.getBoundingClientRect();

            if (endTranslateX < childRect.x - contentRect.x + (childRect.width / 2)) {
                translateX = (childRect.x - contentRect.x) * -1;
                return true;
            }
        });

        var foundChildY = childrenElements.find(function (child) {
            var childRect = child.getBoundingClientRect();

            if (endTranslateY < childRect.y - contentRect.y + (childRect.height / 2)) {
                translateY = (childRect.y - contentRect.y) * -1;
                return true;
            }
        });

        var maxOffsetX = getMaxOffset('x');
        var maxOffsetY = getMaxOffset('y');

        if (!foundChildX) {
            translateX = maxOffsetX;
            if (childrenElements.children && childrenElements.children.length > 0) {
                foundChildX = childrenElements.children[childrenElements.children.length - 1];
            }
        }

        if (!foundChildY) {
            translateY = maxOffsetY;
            if (childrenElements.children && childrenElements.children.length > 0) {
                foundChildY = childrenElements.children[childrenElements.children.length - 1];
            }
        }

        if (foundChildX) {
            if (startTranslateX - 5 <= translateX && translateX < startTranslateX + 5) {
                if (pointerSpeed('x') < -500) {
                    if (foundChildX.nextElementSibling) {
                        translateX = translateX - foundChildX.getBoundingClientRect().width;
                        foundChildX = foundChildX.nextElementSibling;
                    }
                }
                if (500 < pointerSpeed('x')) {
                    if (foundChildX.previousElementSibling) {
                        translateX = translateX + foundChildX.previousElementSibling.getBoundingClientRect().width;
                        foundChildX = foundChildX.previousElementSibling;
                    }
                }
            }
        }

        translateX = Math.max(translateX, maxOffsetX);
        translateY = Math.max(translateY, maxOffsetY);

        if (getContentSize('x') <= mainRect.width) {
            translateX = 0;
        }

        if (getContentSize('y') <= mainRect.heigth) {
            translateY = 0;
        }

        if (mode == 'x') {
            translateY = 0;
        }

        if (mode == 'y') {
            translateX = 0;
        }

        contentElement.style.transform = 'translate(' + translateX + 'px, ' + translateY + 'px)';
    }

    init();
})();