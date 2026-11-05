use std::process::Command;
use std::thread;

use tauri::Url;

const EIGENE_ADRESSE: &str = "https://tages-dashboard-iota.vercel.app";

/// Wohin eine Adresse gehört, die das Fenster öffnen will.
#[derive(Debug, PartialEq)]
pub enum LinkZiel {
    ImFenster,
    Browser,
    Blockiert,
}

pub fn link_ziel(adresse: &Url) -> LinkZiel {
    let eigene = Url::parse(EIGENE_ADRESSE).expect("EIGENE_ADRESSE ist eine gültige Adresse");
    if adresse.origin() == eigene.origin() {
        LinkZiel::ImFenster
    } else if matches!(adresse.scheme(), "http" | "https") {
        LinkZiel::Browser
    } else {
        LinkZiel::Blockiert
    }
}

/// Startet den Standardbrowser. Der eigene Thread wartet auf das Ende von `open`, damit kein Zombie-Prozess bleibt
/// und das Fenster nicht hängt.
pub fn im_browser_oeffnen(adresse: &Url) {
    let adresse = adresse.to_string();
    thread::spawn(move || {
        let _ = Command::new("open").arg(adresse).status();
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ziel(adresse: &str) -> LinkZiel {
        link_ziel(&adresse.parse().unwrap())
    }

    #[test]
    fn eigene_seiten_bleiben_im_fenster() {
        assert_eq!(
            ziel("https://tages-dashboard-iota.vercel.app/"),
            LinkZiel::ImFenster
        );
        assert_eq!(
            ziel("https://tages-dashboard-iota.vercel.app/login?x=1#a"),
            LinkZiel::ImFenster
        );
        assert_eq!(
            ziel("https://TAGES-DASHBOARD-IOTA.vercel.app/"),
            LinkZiel::ImFenster
        );
    }

    #[test]
    fn fremde_adressen_gehen_in_den_browser() {
        assert_eq!(ziel("https://openai.com/news"), LinkZiel::Browser);
        assert_eq!(ziel("http://example.com/"), LinkZiel::Browser);
    }

    #[test]
    fn aehnliche_adressen_sind_fremd() {
        assert_eq!(
            ziel("https://tages-dashboard-iota.vercel.app.example.com/"),
            LinkZiel::Browser
        );
        assert_eq!(
            ziel("https://example.com/tages-dashboard-iota.vercel.app"),
            LinkZiel::Browser
        );
        assert_eq!(
            ziel("https://tages-dashboard-iota.vercel.app:8443/"),
            LinkZiel::Browser
        );
        assert_eq!(
            ziel("http://tages-dashboard-iota.vercel.app/"),
            LinkZiel::Browser
        );
    }

    #[test]
    fn andere_schemata_sind_blockiert() {
        for adresse in [
            "file:///etc/hosts",
            "javascript:alert(1)",
            "mailto:a@example.com",
            "about:blank",
        ] {
            assert_eq!(ziel(adresse), LinkZiel::Blockiert);
        }
    }

    #[test]
    fn eigene_adresse_passt_zur_konfiguration() {
        assert!(
            include_str!("../tauri.conf.json")
                .contains(&format!("\"frontendDist\": \"{EIGENE_ADRESSE}\""))
        );
    }
}
