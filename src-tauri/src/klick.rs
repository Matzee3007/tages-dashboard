/// Was ein Linksklick auf das Symbol in der Menüleiste tut.
#[derive(Debug, PartialEq)]
pub enum KlickAktion {
    Ausblenden,
    NachVorn,
}

pub fn klick_aktion(sichtbar: bool, fokussiert: bool) -> KlickAktion {
    if sichtbar && fokussiert {
        KlickAktion::Ausblenden
    } else {
        KlickAktion::NachVorn
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn vorne_wird_ausgeblendet() {
        assert_eq!(klick_aktion(true, true), KlickAktion::Ausblenden);
    }

    #[test]
    fn minimiert_oder_hinten_kommt_nach_vorn() {
        assert_eq!(klick_aktion(true, false), KlickAktion::NachVorn);
    }

    #[test]
    fn ausgeblendet_kommt_nach_vorn() {
        assert_eq!(klick_aktion(false, false), KlickAktion::NachVorn);
        assert_eq!(klick_aktion(false, true), KlickAktion::NachVorn);
    }
}
