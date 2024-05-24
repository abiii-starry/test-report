const imgUrl = {
    bean: "/fixtures/img/bean-man.png",
    monster: "/fixtures/img/monster.png"
};
let mark = 0;
let items = document.querySelectorAll(".whole ul>li");

setInterval(() => {
    if (mark < items.length - 1) {
        items[mark].classList.add("inactive");
        items[mark].nextElementSibling.firstElementChild.src = imgUrl.bean;
        mark++;
    }
    else if (mark === items.length - 1) {
        items[mark].classList.add("inactive");
        mark++;
    } 
    else if (mark > items.length - 1) {
        for (let i=0; i<=items.length - 1; i++) {
            let initElem = items[i].firstElementChild;
            initElem.src = i === 0 ? imgUrl.bean : imgUrl.monster;
            items[i].classList.remove("inactive");
        }
        mark = 0;
    }
}, 600);