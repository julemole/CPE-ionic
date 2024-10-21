export interface Taxonomy {
  data:    TaxonomyData[];
  meta:    TaxonomyMeta;
}

export interface TaxonomyData {
  type:          string;
  id:            string;
  attributes:    Attributes;
  relationships: Relationships;
}

export interface Attributes {
  drupal_internal__tid:          number;
  drupal_internal__revision_id:  number;
  langcode:                      string;
  revision_created:              Date;
  status:                        boolean;
  name:                          string;
  description:                   null;
  weight:                        number;
  changed:                       Date;
  default_langcode:              boolean;
  revision_translation_affected: boolean;
  path:                          Path;
}

export interface Path {
  alias:    null;
  pid:      null;
  langcode: string;
}

export interface Relationships {
  vid:           Parent;
  revision_user: Parent;
  parent:        Parent;
}

export interface Parent {
  data:  DataDatum[] | null;
}

export interface DataDatum {
  type: string;
  id:   string;
}

export interface DataMeta {
  drupal_internal__target_id: string;
}

export interface TaxonomyMeta {
  count: number;
}
