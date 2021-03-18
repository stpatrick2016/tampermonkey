// ==UserScript==
// @name         Omaze - fill free entry automatically
// @namespace    http://www.patrick.dev/
// @version      0.1
// @description  automatically fills in Omaze.com entries. You only click I am not a robot and submit.
// @author       Philip Patrick
// @match        https://fame.omaze.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const firstName = "Monica";
    const lastName = "Bellucci";
    const email = "monica.bellucci@mail.com";
    const address1 = "1 Best Actres Drv";
    const address2 = "Apt. 0";
    const city = "Rome";
    const country = "Italy";
    const zipcode = "123456";
    const promoCode = "LUCKY150";

    setInputValue("first_name", firstName);
    setInputValue("last_name", lastName);
    setInputValue("email", email);
    setInputValue("address1", address1);
    setInputValue("address2", address2);
    setInputValue("city", city);
    setInputValue("promocode", promoCode);

    let countrySelector = document.getElementById("country-select");
    if(countrySelector != null) {
        for(let i=0; i<countrySelector.options.length; i++) {
            if(countrySelector.options[i].text === country) {
                countrySelector.options.selectedIndex = i;
                break;
            }
        }

        let evt = document.createEvent('HTMLEvents');
        evt.initEvent('change', false, false);
        countrySelector.dispatchEvent(evt);
    }

    setInputValue("zip", zipcode);
    doButtonClick("fame-promocode__submit-button");
})();

function setInputValue(name, value) {
    var inputs = document.getElementsByName(name);
    if(inputs.length > 0)
    {
        inputs[0].focus();
        inputs[0].value = value;
        inputs[0].classList.remove('hkjs--empty');
        inputs[0].classList.add('hkjs--not-empty');
        inputs[0].dispatchEvent(new KeyboardEvent("keyup", {'key':39})); //39 - arrow right
    }
}

function doButtonClick(id){
    var btn = document.getElementById(id);
    if(btn != null) {
        btn.click();
    }
}

function setInputValueById(id, value) {
    var input = document.getElementById(id);
    if(input != null) {
        input.value = value;
    }
}
