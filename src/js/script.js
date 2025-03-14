const CONFIG = {
    DISCORD_WEBHOOK_URL: "https://discord.com/api/webhooks/1349389585205039135/LhTZsi0KfrOP6-e4POFStp_3UbYFzlTwhzZWd3e80nwm2jcJsXSsVJpCmSz5b4pQNtXb", // Du musst hier deine Webhook-URL hinzufügen
    MESSAGE_COOLDOWN: 60000,
}

const header = document.querySelector("header")
const navLinks = document.querySelectorAll("nav ul li a")
const hamburger = document.querySelector(".hamburger")
const nav = document.querySelector("nav")
const contactForm = document.getElementById("contactForm")
const contactMethodSelect = document.getElementById("contactMethod")
const usernameGroup = document.getElementById("usernameGroup")
const submitButton = contactForm.querySelector('button[type="submit"]')
const toast = document.getElementById("toast")
const cooldownMessage = document.getElementById("cooldownMessage")
const successModal = document.getElementById("successModal")
const modalCloseBtn = document.querySelector(".modal-close")
const footerConfirmation = document.getElementById("footerConfirmation")

document.addEventListener("DOMContentLoaded", () => {
    initAnimations()
    setupEventListeners()
    initFormBehavior()
    initButtonFunctionality()
    checkExistingCooldown()
    initModal()
})

function initModal() {
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener("click", () => {
            successModal.classList.remove("show")
        })
    }

    successModal.addEventListener("click", (e) => {
        if (e.target === successModal) {
            successModal.classList.remove("show")
        }
    })
}

function showSuccessModal() {
    successModal.classList.add("show")
}

function showFooterConfirmation() {
    console.log("Zeige Footer-Bestätigung")
    footerConfirmation.classList.add("show")

    setTimeout(() => {
        footerConfirmation.classList.remove("show")
    }, 5000)
}

function handleScroll() {
    if (window.scrollY > 50) {
        header.style.boxShadow = "var(--shadow-md)"
        header.style.height = "70px"
    } else {
        header.style.boxShadow = "var(--shadow-sm)"
        header.style.height = "var(--header-height)"
    }

    updateActiveNavLink()
}

function updateActiveNavLink() {
    const sections = document.querySelectorAll("section")

    sections.forEach((section) => {
        const sectionTop = section.offsetTop - 100
        const sectionHeight = section.offsetHeight
        const sectionId = section.getAttribute("id")

        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            navLinks.forEach((link) => {
                link.classList.remove("active")
                if (link.getAttribute("href") === `#${sectionId}`) {
                    link.classList.add("active")
                }
            })
        }
    })
}

function toggleMobileMenu() {
    hamburger.classList.toggle("active")
    nav.classList.toggle("active")
}

function initFormBehavior() {
    usernameGroup.style.display = "none"

    contactMethodSelect.addEventListener("change", () => {
        const method = contactMethodSelect.value

        if (method === "discord" || method === "telegram") {
            usernameGroup.style.display = "block"
            document.getElementById("username").setAttribute("required", "required")
        } else {
            usernameGroup.style.display = "none"
            document.getElementById("username").removeAttribute("required")
        }
    })

    contactForm.addEventListener("submit", handleFormSubmit)
}

async function handleFormSubmit(e) {
    e.preventDefault()

    if (!CONFIG.DISCORD_WEBHOOK_URL) {
        console.log("Keine Webhook-URL konfiguriert. Formular wird nicht gesendet.")
        simulateSuccessfulSubmission()
        return
    }

    const lastSubmissionTime = localStorage.getItem("lastFormSubmission")
    const currentTime = Date.now()

    if (lastSubmissionTime && currentTime - Number.parseInt(lastSubmissionTime) < CONFIG.MESSAGE_COOLDOWN) {
        const remainingTime = Math.ceil(
            (Number.parseInt(lastSubmissionTime) + CONFIG.MESSAGE_COOLDOWN - currentTime) / 1000,
        )
        cooldownMessage.textContent = `Bitte warte ${remainingTime} Sekunden, bevor du eine weitere Nachricht sendest.`
        return
    }

    cooldownMessage.textContent = ""

    submitButton.classList.add("loading")

    const contactMethod = contactMethodSelect.value
    const username = document.getElementById("username").value
    const email = document.getElementById("email").value
    const message = document.getElementById("message").value

    const data = {
        content: "Neue Kontaktformular-Einsendung!",
        embeds: [
            {
                title: "Kontaktformular-Einsendung",
                color: 6765239,
                fields: [
                    {
                        name: "Kontaktmethode",
                        value: contactMethod,
                        inline: true,
                    },
                    {
                        name: "E-Mail",
                        value: email,
                        inline: true,
                    },
                ],
                description: message,
                timestamp: new Date().toISOString(),
            },
        ],
    }

    if (username) {
        data.embeds[0].fields.push({
            name: contactMethod === "discord" ? "Discord-Benutzername" : "Telegram-Benutzername",
            value: username,
            inline: true,
        })
    }

    try {
        const response = await fetch(CONFIG.DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })

        if (response.ok) {
            handleSuccessfulSubmission(currentTime)
        } else {
            showToast("Nachricht konnte nicht gesendet werden. Bitte versuche es später erneut.", "error")
            console.error("Webhook-Fehler:", await response.text())
        }
    } catch (error) {
        showToast("Nachricht konnte nicht gesendet werden. Bitte überprüfe deine Internetverbindung.", "error")
        console.error("Fehler beim Senden an Webhook:", error)
    } finally {
        submitButton.classList.remove("loading")
    }
}

function simulateSuccessfulSubmission() {
    submitButton.classList.add("loading")

    setTimeout(() => {
        submitButton.classList.remove("loading")
        handleSuccessfulSubmission(Date.now())
    }, 1000)
}

function handleSuccessfulSubmission(currentTime) {
    localStorage.setItem("lastFormSubmission", currentTime.toString())

    showFooterConfirmation()
    showSuccessModal()
    contactForm.reset()
    startCooldownTimer(CONFIG.MESSAGE_COOLDOWN / 1000)
}

function startCooldownTimer(seconds) {
    let remainingTime = seconds
    cooldownMessage.textContent = `Bitte warte ${remainingTime} Sekunden, bevor du eine weitere Nachricht sendest.`

    const timerInterval = setInterval(() => {
        remainingTime--

        if (remainingTime <= 0) {
            clearInterval(timerInterval)
            cooldownMessage.textContent = ""
        } else {
            cooldownMessage.textContent = `Bitte warte ${remainingTime} Sekunden, bevor du eine weitere Nachricht sendest.`
        }
    }, 1000)
}

function showToast(message, type = "success") {
    toast.textContent = message
    toast.className = `toast ${type}`
    toast.classList.add("show")

    setTimeout(() => {
        toast.classList.remove("show")
    }, 5000)
}

function initAnimations() {
    const skillCards = document.querySelectorAll(".skill-card")

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = "1"
                    entry.target.style.transform = "translateY(0)"
                    observer.unobserve(entry.target)
                }
            })
        },
        { threshold: 0.2 },
    )

    skillCards.forEach((card) => {
        card.style.opacity = "0"
        card.style.transform = "translateY(20px)"
        card.style.transition = "opacity 0.6s ease, transform 0.6s ease"
        observer.observe(card)
    })

    const ghostText = document.querySelector(".ghost-text")
    if (ghostText) {
        ghostText.addEventListener("mouseenter", () => {
            ghostText.style.transform = "translateY(-3px) scale(1.05)"
            ghostText.style.textShadow = "0 0 20px rgba(98, 0, 238, 0.5)"
        })

        ghostText.addEventListener("mouseleave", () => {
            ghostText.style.transform = "translateY(0) scale(1)"
            ghostText.style.textShadow = "0 0 15px rgba(98, 0, 238, 0.3)"
        })
    }
}

function initButtonFunctionality() {
    const aboutMeBtn = document.querySelector(".hero-content .btn.primary")
    const getInTouchBtn = document.querySelector(".hero-content .btn.secondary")

    if (aboutMeBtn) {
        aboutMeBtn.addEventListener("click", (e) => {
            e.preventDefault()
            const aboutSection = document.querySelector("#about")
            if (aboutSection) {
                aboutSection.scrollIntoView({ behavior: "smooth" })
            }
        })
    }

    if (getInTouchBtn) {
        getInTouchBtn.addEventListener("click", (e) => {
            e.preventDefault()
            const contactSection = document.querySelector("#contact")
            if (contactSection) {
                contactSection.scrollIntoView({ behavior: "smooth" })
            }
        })
    }

    const backToTopBtn = document.querySelector(".back-to-top a")
    if (backToTopBtn) {
        backToTopBtn.addEventListener("click", (e) => {
            e.preventDefault()
            window.scrollTo({ top: 0, behavior: "smooth" })
        })
    }

    const buttons = document.querySelectorAll(".btn")
    buttons.forEach((button) => {
        button.addEventListener("click", createRipple)
    })
}

function checkExistingCooldown() {
    const lastSubmissionTime = localStorage.getItem("lastFormSubmission")
    if (lastSubmissionTime) {
        const currentTime = Date.now()
        const elapsedTime = currentTime - Number.parseInt(lastSubmissionTime)

        if (elapsedTime < CONFIG.MESSAGE_COOLDOWN) {
            const remainingSeconds = Math.ceil((CONFIG.MESSAGE_COOLDOWN - elapsedTime) / 1000)
            startCooldownTimer(remainingSeconds)
        }
    }
}

function createRipple(event) {
    const button = event.currentTarget

    const circle = document.createElement("span")
    const diameter = Math.max(button.clientWidth, button.clientHeight)
    const radius = diameter / 2

    circle.style.width = circle.style.height = `${diameter}px`
    circle.style.left = `${event.clientX - button.offsetLeft - radius}px`
    circle.style.top = `${event.clientY - button.offsetTop - radius}px`
    circle.classList.add("ripple")

    const ripple = button.querySelector(".ripple")
    if (ripple) {
        ripple.remove()
    }

    button.appendChild(circle)
}

function setupEventListeners() {
    window.addEventListener("scroll", handleScroll)

    hamburger.addEventListener("click", toggleMobileMenu)
    navLinks.forEach((link) => {
        link.addEventListener("click", () => {
            if (hamburger.classList.contains("active")) {
                toggleMobileMenu()
            }
        })
    })
}

