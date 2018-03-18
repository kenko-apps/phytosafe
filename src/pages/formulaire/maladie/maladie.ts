import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { NavController, ModalController } from 'ionic-angular';

import { TranslateService } from '@ngx-translate/core';
import { Keyboard } from '@ionic-native/keyboard';

import { Therapies } from '../therapies/therapies';
import{ Autocomplete } from '../../autocomplete/autocomplete';

import { Formulaire } from '../../../providers/formulaire';
import { LocalStockage } from '../../../providers/localstockage';
import { Cancer } from '../../../providers/cancer';
import { Diacritics } from '../../../providers/diacritics';
import { Inactif } from '../../../providers/inactif';
import { MaladieValidator } from '../../../providers/validators';

@Component({
  selector: 'maladie',
  templateUrl: 'maladie.html'
})
export class Maladie implements OnInit {

  maladieForm: FormGroup;
  submitAttempt: boolean = false;
  organeNom: any;
  organeElement: any;
  organeTitre: string;
  organePlaceholder: string;
  organeChoix: string;
  questionOrgane: boolean = false;
  
  constructor(public navCtrl: NavController, public modalCtrl: ModalController, public translate: TranslateService, public formBuilder: FormBuilder, public formulaire: Formulaire, public localstockage: LocalStockage, public organe: Cancer, public keyboard: Keyboard, public diacritics: Diacritics, public inactif: Inactif) {
    this.maladieForm = formBuilder.group({
      organeboolForm : ['', Validators.required],
      organeForm: [''],
      nom_organeForm: [''],
      etatForm:  ['', Validators.required]
    },{ validator: MaladieValidator.isValid});
    this.organeNom = [];
    this.organeElement = [];
  }

  ngOnInit(){
    this.organe.makeCancerList().then((liste) =>{
      this.organeNom = liste[0];
      this.organeElement = liste[1];
    });
    this.organeChoix = '';
  }

  ionViewDidEnter(){
    //Si l'utilisateur est inactif, une alerte est envoyée avec la possibilité de continuer ou de recommencer le questionnaire.
    this.inactif.idleSet(this.navCtrl);
  }

  ionViewWillLeave(){
    this.inactif.idleStop();
  }

  /**
   * Fonction qui permet l'entrée du nom de l'organe primitif atteint.
   * @method organeOui
   * @param {} - aucun paramètre n'est passé à la fonction.
   * @returns {} - aucune valeur n'est retournée par la fonction.
   */
  organeOui() {
    this.questionOrgane = true;
  }

  /**
   * Fonction qui supprime l'entrée du nom de l'organe primitif atteint.
   * @method organeNon
   * @param {} - aucun paramètre n'est passé à la fonction.
   * @returns {} - aucune valeur n'est retournée par la fonction.
   */
  organeNon() {
    this.questionOrgane = false;
    this.maladieForm.patchValue({organeForm: ''});
    this.maladieForm.patchValue({nom_organeForm: ''});
    this.organeChoix = '';
  }

  /**
   * Fonction qui est liée au champ "Organe primitif atteint" sur la deuxième page du formulaire - Maladie.
   * Elle permet d'ouvrir une page modale (pages/autocomplete) qui propose, en fonction des entrées de l'utilisateur une liste de noms possibles : autocompletion.
   * @method showOrganeModal
   * @requires pages/autocomplete - elle appelle la page autocomplete.ts.
   * @param {} - aucun paramètre n'est passé à la fonction.
   * @returns {} - aucune valeur n'est retournée par la fonction.
   */
  showOrganeModal(){
    this.translate.get('TITRE_MODAL_ORGANE').subscribe(value => {
      this.organeTitre = value;
    });
    this.translate.get('PLACEHOLDER_MODAL_ORGANE').subscribe(value => {
      this.organePlaceholder = value;
    });
    let modal = this.modalCtrl.create(Autocomplete, {dataAutocomplete: this.organeNom, titreAutocomplete: this.organeTitre, placeholderAutocomplete: this.organePlaceholder});
    modal.onDidDismiss(data => {
      this.organeChoix = data;
      var organeData = this.organeElement.find((val)=>{
        let strVal = this.diacritics.replaceDiacritics(val.nom.toLowerCase());
        let strData = this.diacritics.replaceDiacritics(data.toLowerCase());
        if(strVal.indexOf(strData) > -1){
          return val;
        }
      });
      if(organeData){
        this.maladieForm.patchValue({organeForm: organeData.id});
        this.maladieForm.patchValue({nom_organeForm: organeData.nom});
      } else {
        this.maladieForm.patchValue({organeForm: 'AUCUN'});
        this.maladieForm.patchValue({nom_organeForm: this.organeChoix});
      }
    });
    modal.present();
  }

  /**
   * Fonction qui est liée au bouton "Continuer" sur la deuxième page du formulaire - Maladie.
   * Elle valide les valeurs entrées dans les champs du formulaire et les stocke localement. 
   * Une fois ces valeurs stockées, elle récupère la valeur stockée correspondant à l'identificant du formulaire. 
   * Si aucun identifiant n'a été stocké, elle créé un nouveau formulaire avec toutes les données stockées. Sinon, elle met à jour le formulaire avec ces mêmes données.
   * Elle affiche ensuite la troisième page du formulaire - Traitements Alternatifs.
   * @method nextPage
   * @requires providers/localstockage - la fonction utilise les méthodes setData, getData, getAllData.
   * @requires providers/formulaire - la fonction utilise les méthodes createForm et updateForm.
   * @param {} - aucun paramètre n'est passé à la fonction.
   * @returns {} - aucune valeur n'est retournée par la fonction.
   */
  nextPage() {
    this.submitAttempt = true;
    if(this.maladieForm.valid){

      //Stockage local des données remplies dans cette page de formulaire
      this.localstockage.setData(this.maladieForm.value).then((message) => {
        console.log('Maladie : ' + message);
        //Mise à jour/création du formulaire sur le serveur avec les données entrées sur cette page du formulaire
        this.localstockage.getData("idForm").then((val)=> {
          this.localstockage.getAllData().then((dataForm)=>{
            //il faut créer/mettre à jour le formulaire avec toutes les données stockées
            if (val==null){
              //Si le formulaire n'a pas été créé, il faut le créer
              this.formulaire.createForm(dataForm);
            } else {
              //Sinon, il faut le mettre à jour
              this.formulaire.updateForm(dataForm);
            }
          });
        });
        //Navigation à la page du formulaire - Thérapies
        this.navCtrl.push(Therapies);
      });
    }
  }
}