/// <reference path="../../../libs/js/property-inspector.js" />
/// <reference path="../../../libs/js/utils.js" />

$PI.onConnected((jsn) => {
    const form = document.querySelector('#property-inspector');
    const speakerSelect = document.querySelector('select');
    const {actionInfo, appInfo, connection, messageType, port, uuid} = jsn;
    const {payload, context} = actionInfo;
    const {settings} = payload;

    $PI.sendToPlugin({command: 'getSpeakers'});

    Utils.setFormValue(settings, form);

    form.addEventListener(
        'input',
        Utils.debounce(150, () => {
            const value = Utils.getFormValue(form);
            console.log(value);
            $PI.setSettings(value);
        })
    );

    speakerSelect.addEventListener(
        'change',
        Utils.debounce(150, () => {
            const value = Utils.getFormValue(form);
            console.log(value);
            $PI.setSettings(value);
        })
    );
});

$PI.onDidReceiveSettings('rocks.raff.tuneblade.action', ({payload}) => {
    console.log('onDidReceiveSettings', payload);
});

$PI.onSendToPropertyInspector('rocks.raff.tuneblade.action', ({payload}) => {
    const speakerSelect = document.querySelector('select');
    speakerSelect.innerHTML = '';
    console.log('onSendToPropertyInspector', payload);
    let value = '';
    payload.forEach(({id, selected, name}) => {
        const option = document.createElement('option');
        option.innerHTML = name;
        option.setAttribute('value', id);
        if (selected) {
            value = id;
        }
        speakerSelect.appendChild(option);
        console.log('value', value);
        speakerSelect.value = value;
    });
});
