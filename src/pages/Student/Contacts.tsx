import {
    FaEnvelope,
    FaFacebook,
    FaInstagram,
    FaLinkedin,
    FaMapPin,
    FaPhone,
    FaTelegram,
    FaYoutube
} from "react-icons/fa6";

const Contacts = () => {

    return (
        <div>
            <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2999.3195990276795!2d69.21807057610975!3d41.258376703987416!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38ae8bbe0da01105%3A0x83ab2e159ab60db9!2sKimyo%20International%20University%20in%20Tashkent!5e0!3m2!1sru!2s!4v1709533203435!5m2!1sru!2s"
                style={ { border: 0, width: '100%', height: '250px' } }
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="d-flex justify-content-center mt-4">
                <div className="contacts__card">
                    <a
                        href="https://maps.app.goo.gl/YAsvPhPpZzFpp1La6"
                        className="contacts__item"
                    >
                        <div className="contacts__icon">
                            <FaMapPin/>
                        </div>
                        ул. Шота Руставелли, 156, 100121 Ташкент
                    </a>
                    <a
                        href="tel:+998781294040"
                        className="contacts__item"
                    >
                        <div className="contacts__icon">
                            <FaPhone/>
                        </div>
                        +998 78 129 40 40
                    </a>
                    <a
                        href="mailto:info@kiut.uz"
                        className="contacts__item"
                    >
                        <div className="contacts__icon">
                            <FaEnvelope/>
                        </div>
                        info@kiut.uz
                    </a>
                </div>

                <div className="d-flex flex-wrap mt-3">
                    <a
                        href="https://www.facebook.com/kiut.uz/"
                        className="contacts__sn contacts__sn--facebook"
                        target="_blank"
                    >
                        <FaFacebook/>
                    </a>
                    <a
                        href="https://pl.linkedin.com/company/yeoju-technical-institute-in-tashkent?trk=ppro_cprof"
                        className="contacts__sn contacts__sn--linkedin"
                        target="_blank"
                    >
                        <FaLinkedin/>
                    </a>
                    <a
                        href="https://t.me/kiut_official"
                        className="contacts__sn contacts__sn--telegram"
                        target="_blank"
                    >
                        <FaTelegram/>
                    </a>
                    <a
                        href="https://www.instagram.com/kiut.uz_rasmiy/"
                        className="contacts__sn contacts__sn--instagram"
                        target="_blank"
                    >
                        <FaInstagram/>
                    </a>
                    <a
                        href="https://www.youtube.com/channel/UC9ewNmt05rUSXoZHBsMBYjA"
                        className="contacts__sn contacts__sn--youtube"
                        target="_blank"
                    >
                        <FaYoutube/>
                    </a>
                </div>
            </div>
        </div>
    )
}

export default Contacts;

