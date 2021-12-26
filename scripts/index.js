const yyyymmddhhmmss = (date) => {
    var yyyy = date.getFullYear()
    var mm = date.getMonth() < 9 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1)
    var dd = date.getDate() < 10 ? '0' + date.getDate() : date.getDate()
    var hh = date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
    var min = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()
    var ss = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds()
    return `${dd}.${mm}.${yyyy} ${hh}:${mm}:${ss}`
}

$(() => {

    // settings

    const serverUrl = 'http://localhost:3010'

    const updateInterval = 2 * 1000

    // queries

    const sendDeauth = () => {
        return $.ajax({
            url: serverUrl + '/deauth',
            type: 'GET',
            dataType: 'json',
            data: {
                userId: currentUser.id,
            },
        })
    }

    const sendAuth = (name) => {
        return $.ajax({
            url: serverUrl + '/auth',
            type: 'GET',
            dataType: 'json',
            data: {
                name,
            },
        })
    }

    const getMessages = () => {
        return $.ajax({
            url: serverUrl + '/messages',
            type: 'GET',
            dataType: 'json',
            data: {
                opponentId: opponentUser.id,
                userId: currentUser.id,
            },
        })
    }

    const sendMessage = (text) => {
        return $.ajax({
            url: serverUrl + '/messages/send',
            type: 'GET',
            dataType: 'json',
            data: {
                recepientId: opponentUser.id,
                authorId: currentUser.id,
                text,
            },
        })
    }

    const getOpponents = () => {
        return $.ajax({
            url: serverUrl + '/users',
            type: 'GET',
            dataType: 'json',
            data: {
                userId: currentUser.id,
            },
        })
    }

    // app

    let savedUser = localStorage.getItem('user')

    let currentUser = savedUser ? JSON.parse(savedUser) : undefined

    let opponentUser = undefined

    let opponentsLoadedList = undefined

    let messagesLoadedList = undefined

    const changeScreen = (code) => {
        $('.content-screens>div:not(.' + code + ')').addClass('d-none')
        $('.content-screens>div.' + code).removeClass('d-none')
    }

    const updateScreen = () => {
        changeScreen(currentUser ? 'content-chat' : 'content-name-selector')
        $('.user--logout').toggleClass('d-none', !currentUser)
    }

    updateScreen()

    $('.name-selector').on('submit', (event) => {
        event.preventDefault()
        let name = $('.name-selector-name').first().val()

        if (name) {
            sendAuth(name)
                .then((userData) => {
                    currentUser = userData
                    localStorage.setItem('user', JSON.stringify(userData))
                    updateScreen()
                })
                .catch((error) => console.error(error))
        }
    })

    $(document).on('click', '.user--logout', (event) => {
        event.preventDefault()

        if (currentUser) {
            sendDeauth()
                .then((action) => {
                    currentUser = undefined
                    localStorage.removeItem('user')
                    updateScreen()
                })
                .catch((error) => console.error(error))
        }
    })

    const getAvatarLetter = (name) => {
        return (name ?? 'чувак').substr(0, 1)
    }

    const setMessagesListStatus = (status) => {
        switch (status) {
            case 'empty':
                $('.chat-messages--send-form').removeClass('d-none')

                $('.chat-messages--no-content').removeClass('d-none')
                $('.chat-messages--no-opponent').addClass('d-none')
                $('.chat-messages--loading').addClass('d-none')
                $('.chat-messages--content').addClass('d-none')
                break;

            case 'loading':
                $('.chat-messages--send-form').addClass('d-none')

                $('.chat-messages--no-content').addClass('d-none')
                $('.chat-messages--no-opponent').addClass('d-none')
                $('.chat-messages--loading').removeClass('d-none')
                $('.chat-messages--content').addClass('d-none')
                break;

            case 'no-opponent':
                $('.chat-messages--send-form').addClass('d-none')

                $('.chat-messages--no-content').addClass('d-none')
                $('.chat-messages--no-opponent').removeClass('d-none')
                $('.chat-messages--loading').addClass('d-none')
                $('.chat-messages--content').addClass('d-none')
                break;
        
            case 'list':
                $('.chat-messages--send-form').removeClass('d-none')

                $('.chat-messages--no-content').addClass('d-none')
                $('.chat-messages--no-opponent').addClass('d-none')
                $('.chat-messages--loading').addClass('d-none')
                $('.chat-messages--content').removeClass('d-none')
                break;
        }
    }

    const updateMessages = (seamless = false) => {
        if (!seamless) {
            setMessagesListStatus('no-opponent')
        }

        if (currentUser && opponentUser) {
            if (!seamless) {
                setMessagesListStatus('loading')
            }
            
            $('.chat-messages--opponent').html('(' + opponentUser?.name + ')')

            getMessages()
                .then((data) => {
                    let messages = data

                    messagesLoadedList = messages

                    if (Array.isArray(messages) && messages.length) {
                        setMessagesListStatus('list')

                        $('.chat-messages--content').html(messages.map((message) => {
                            let date = message ? yyyymmddhhmmss(new Date(message.createdAt)) : 'когда-то'

                            if (message.authorId == currentUser?.id ?? -1) {
                                return (
                                    '<div class="chat-message message-self">' +
                                        '<div><img class="chat-user--avatar user--avatar avatar-min" src="https://dummyimage.com/128x128/000/ffffff.jpg&text=' + getAvatarLetter(currentUser.name) + '" alt=""></div>' +
                                        '<div class="chat-message--text">' +
                                            '<div>' + message?.text + '</div>' +
                                            '<div class="text-muted">' + date + '</div>' +
                                        '</div>' +
                                    '</div>'
                                )
                            }

                            let opponentName = opponentUser.name ?? 'чувак'

                            return (
                                '<div class="chat-message">' +
                                    '<div><img class="chat-user--avatar user--avatar avatar-min" src="https://dummyimage.com/128x128/000/ffffff.jpg&text=' + getAvatarLetter(opponentName) + '" alt=""></div>' +
                                    '<div class="chat-message--text">' +
                                        '<div class="chat-message--author"><b>' + opponentName + '</b></div>' +
                                        '<div>' + message?.text + '</div>' +
                                        '<div class="text-muted">' + date + '</div>' +
                                    '</div>' +
                                '</div>'
                            )
                        }))
                    } else {
                        setMessagesListStatus('empty')
                    }
                })
                .catch((error) => console.error(error))
        } else {
            $('.chat-messages--opponent').html('')
        }
    }

    updateMessages()

    setInterval(() => {
        updateMessages(true)
    }, updateInterval)

    const setOpponentsStatus = (status) => {
        switch (status) {
            case 'empty':
                $('.chat-users--no-content').removeClass('d-none')
                $('.chat-users--loading').addClass('d-none')
                $('.chat-users--content').addClass('d-none')
                break;

            case 'loading':
                $('.chat-users--no-content').addClass('d-none')
                $('.chat-users--loading').removeClass('d-none')
                $('.chat-users--content').addClass('d-none')
                break;
    
            case 'list':
                $('.chat-users--no-content').addClass('d-none')
                $('.chat-users--loading').addClass('d-none')
                $('.chat-users--content').removeClass('d-none')
                break;
        }
    }

    const updateOpponents = (seamless = false) => {
        if (!seamless) {
            setOpponentsStatus('loading')
        }

        if (currentUser) {
            getOpponents()
                .then((data) => {
                    let opponents = data

                    opponentsLoadedList = opponents

                    if (Array.isArray(opponents) && opponents.length) {
                        setOpponentsStatus('list')

                        $('.chat-users--content').html(
                            opponents
                                .filter((opponent) => opponent.id !== currentUser.id)
                                .map((opponent) => {
                                    let online = opponent.onlineAt >= Date.now() - 5 * 60 * 1000
                
                                    return (
                                        '<div class="chat-user d-flex align-items-center">' +
                                            '<div><img class="chat-user--avatar user--avatar avatar-min" src="https://dummyimage.com/128x128/000/ffffff.jpg&text=' + getAvatarLetter(opponent.name) + '" alt=""></div>' +
                                            '<div class="flex-grow-1">' +
                                                '<div>' + opponent.name + '</div>' +
                                                '<div><span class="badge ' + (online ? 'bg-success' : 'bg-light text-dark') + '">' + (online ? 'онлайн' : 'оффлайн') + '</span></div>' +
                                            '</div>' +
                                            '<div>' +
                                                '<button type="button" class="btn btn-sm btn-primary chat-user--write" data-id="' + opponent.id + '">Написать</button>' +
                                            '</div>' +
                                        '</div>'
                                    )
                                })
                            )
                    } else {
                        setOpponentsStatus('empty')
                    }
                })
                .catch((error) => console.error(error))
        }
    }

    updateOpponents()

    setInterval(() => {
        updateOpponents(true)
    }, updateInterval)

    $(document).on('click', '.chat-user--write', (event) => {
        let id = $(event.target).data('id')

        selectOpponent(id)

        $('.chat-user--write:not([data-id=' + id + '])').prop('disabled', false)
        $('.chat-user--write[data-id=' + id + ']').prop('disabled', true)
    })
    
    const selectOpponent = (id) => {
        let selectedOpponent = opponentsLoadedList?.find((opponent) => opponent.id == id)

        if (selectedOpponent) {
            opponentUser = selectedOpponent

            updateMessages()
        }
    }

    $(document).on('submit', '.chat-messages--send', (event) => {
        event.preventDefault()
        let text = $('.chat-messages--send-text').val()

        if (text) {
            $('.chat-messages--send-text').prop('disabled', true)
            $('.chat-messages--send-button').prop('disabled', true)

            sendMessage(text)
                .then((messageData) => {
                    $('.chat-messages--send-text').prop('disabled', false)
                    $('.chat-messages--send-button').prop('disabled', false)

                    $('.chat-messages--send-text').val('')

                    updateMessages(true)
                })
                .catch((error) => {
                    $('.chat-messages--send-text').prop('disabled', false)
                    $('.chat-messages--send-button').prop('disabled', false)

                    console.error(error)
                })
        }
    })
})
