import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AnimationState, NgxMaterialTimepickerComponent } from './ngx-material-timepicker.component';
import { NgxMaterialTimepickerEventService } from './services/ngx-material-timepicker-event.service';
import { NgxMaterialTimepickerService } from './services/ngx-material-timepicker.service';
import { TimepickerDirective } from './directives/ngx-timepicker.directive';
import { TimeFormatterPipe } from './pipes/time-formatter.pipe';
import { NO_ERRORS_SCHEMA, Type } from '@angular/core';
import { TimePeriod } from './models/time-period.enum';
import { TimeUnit } from './models/time-unit.enum';
import { AnimationEvent } from '@angular/animations';
import { DomService } from './services/dom.service';
import { DateTime } from 'luxon';

class DomServiceStub {
    appendTimepickerToBody(picker: Type<NgxMaterialTimepickerComponent>): void {
    }

    destroyTimepicker(): void {
    }
}

describe('NgxMaterialTimepickerComponent', () => {
    let fixture: ComponentFixture<NgxMaterialTimepickerComponent>;
    let component: NgxMaterialTimepickerComponent;
    let domService: DomService;

    beforeEach(() => {
        fixture = TestBed.configureTestingModule({
            declarations: [
                NgxMaterialTimepickerComponent,
                TimeFormatterPipe
            ],
            providers: [
                NgxMaterialTimepickerService,
                NgxMaterialTimepickerEventService,
                {provide: DomService, useClass: DomServiceStub}
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).createComponent(NgxMaterialTimepickerComponent);

        component = fixture.componentInstance;
        domService = TestBed.get(DomService);
    });

    describe('registerInputAndDefineTime', () => {

        it('should throw Error if register one more timepicker input', () => {
            const input = {} as TimepickerDirective;

            component.registerInputAndDefineTime(input);
            expect(() => component.registerInputAndDefineTime(input))
                .toThrowError('A Timepicker can only be associated with a single input.');
        });

        it('should return min time prop of TimepickerDirective', () => {
            const input = {min: null} as TimepickerDirective;

            component.registerInputAndDefineTime(input);
            expect(component.minTime).toBeNull();
        });

        it('should return max time prop of TimepickerDirective', () => {
            const input = {max: null} as TimepickerDirective;

            component.registerInputAndDefineTime(input);
            expect(component.maxTime).toBeNull();
        });

        it('should return disabled prop of TimepickerDirective', () => {
            const input = {disabled: true} as TimepickerDirective;

            component.registerInputAndDefineTime(input);
            expect(component.disabled).toBeTruthy();
        });

        it('should return format prop of TimepickerDirective', () => {
            const input = {format: 24} as TimepickerDirective;

            component.registerInputAndDefineTime(input);
            expect(component.format).toBe(24);
        });

        it('should set default time equal to min time', () => {
            const min = DateTime.fromObject({hour: 23, minute: 15});
            const input = {min, format: 12, value: undefined} as TimepickerDirective;
            const spy = spyOn(component, 'setDefaultTime');

            component.registerInputAndDefineTime(input);
            expect(spy).toHaveBeenCalledWith('11:15 PM');
        });

        it('should not call setDefaultTime if time set by default', () => {
            const min = DateTime.fromObject({hour: 23, minute: 15});
            const input = {min, format: 12, value: '11:11 am'} as TimepickerDirective;
            const spy = spyOn(component, 'setDefaultTime');

            component.registerInputAndDefineTime(input);
            expect(spy).toHaveBeenCalledTimes(0);
        });
    });

    it('should set format', () => {
        component.format = 24;
        expect(component.format).toBe(24);

        component.format = 10;
        expect(component.format).toBe(12);
    });

    it('should change time unit from HOUR to MINUTE', () => {
        expect(component.activeTimeUnit).toBe(TimeUnit.HOUR);
        component.changeTimeUnit(TimeUnit.MINUTE);
        expect(component.activeTimeUnit).toBe(TimeUnit.MINUTE);
    });

    it('should emit time on setTime and call close fn', () => {
        const spy = spyOn(component, 'close');

        component.timeSet.subscribe(time => expect(time).toBeDefined());
        component.setTime();
        expect(spy).toHaveBeenCalled();
    });

    it('should update hour, minute and period on setDefaultTime', () => {
        const time = '11:12 am';

        component.ngOnInit();
        component.setDefaultTime(time);
        expect(component.selectedHour.time).toBe(11);
        expect(component.selectedMinute.time).toBe(12);
        expect(component.selectedPeriod).toBe(TimePeriod.AM);
    });

    it('should update hour, minute and period on defaultTime input set', () => {
        const time = '01:11 am';

        component.ngOnInit();
        component.defaultTime = time;
        expect(component.selectedHour.time).toBe(1);
        expect(component.selectedMinute.time).toBe(11);
        expect(component.selectedPeriod).toBe(TimePeriod.AM);
    });

    it(`should set isOpened 'true', change animationState to 'enter', call appendTimepickerToBody
     and emit event on open call`, async(() => {
        let counter = 0;
        const spy = spyOn(domService, 'appendTimepickerToBody');

        component.opened.subscribe(() => expect(++counter).toBe(1));
        component.open();
        expect(component.isOpened).toBeTruthy();
        expect(component.animationState).toBe(AnimationState.ENTER);
        expect(spy).toHaveBeenCalledWith(NgxMaterialTimepickerComponent);
    }));

    it('should change animationState to \'leave\' on close call', () => {
        component.close();
        expect(component.animationState).toBe(AnimationState.LEAVE);
    });

    it(`should change isOpened to 'false', activeTimeUnit to 'HOUR', call destroyTimepicker fn
     and emit closed event on animationDone`, () => {
        let counter = 0;
        const event = {
            phaseName: 'done',
            toState: 'leave',
        };
        const spy = spyOn(domService, 'destroyTimepicker');

        component.closed.subscribe(() => expect(++counter).toBe(1));
        component.isOpened = true;
        component.animationDone(event as AnimationEvent);
        expect(component.isOpened).toBeFalsy();
        expect(component.activeTimeUnit).toBe(TimeUnit.HOUR);
        expect(spy).toHaveBeenCalled();
    });

    it(`should do nothing if animation toState is not 'leave' on animationDone`, () => {
        const event = {
            phaseName: 'done',
            toState: 'enter',
        };

        component.isOpened = true;
        component.animationDone(event as AnimationEvent);
        expect(component.isOpened).toBeTruthy();
    });

    it('should call close method if ESC key was pushed', () => {
        const spy = spyOn(component, 'close');
        const event = {
            keyCode: 27,
            stopPropagation: () => null,
            type: 'keydown'
        };

        component.onKeydown(event as KeyboardEvent);
        expect(spy).toHaveBeenCalled();
    });

    it('should not call close method if any key, but ESC was pushed', () => {
        const spy = spyOn(component, 'close');
        const event = {
            keyCode: 28,
            stopPropagation: () => null,
            type: 'keydown'
        };

        component.onKeydown(event as KeyboardEvent);
        expect(spy).toHaveBeenCalledTimes(0);
    });

    it('should not call close method if ESC was pushed and isEsc is \'false\' ', () => {
        const spy = spyOn(component, 'close');
        const event = {
            keyCode: 27,
            stopPropagation: () => null,
            type: 'keydown'
        };

        component.isEsc = false;
        component.onKeydown(event as KeyboardEvent);
        expect(spy).toHaveBeenCalledTimes(0);
    });

    it('should set minutesGap to 5', () => {
        expect(component.minutesGap).toBeUndefined();
        component.minutesGap = 5;

        expect(component.minutesGap).toBe(5);
    });

    it('should set minutesGap to 1', () => {
        expect(component.minutesGap).toBeUndefined();
        component.minutesGap = 65;

        expect(component.minutesGap).toBe(1);
    });

    it('should convert minutesGap to int', () => {
        component.minutesGap = 6.5;

        expect(component.minutesGap).toBe(6);
    });

    it('should not set minutesGap if null or undefined', () => {
        component.minutesGap = undefined;
        expect(component.minutesGap).toBeUndefined();

        component.minutesGap = null;
        expect(component.minutesGap).toBeUndefined();
    });

    it('should change timeUnit to MINUTE and emit selected hour', async(() => {
        const hour = 10;

        expect(component.activeTimeUnit).toBe(TimeUnit.HOUR);

        component.hourSelected.subscribe(h => expect(h).toBe(hour));
        component.onHourSelected(hour);

        expect(component.activeTimeUnit).toBe(TimeUnit.MINUTE);
    }));

    it('should not trigger animation on Open if disableAnimation is true', () => {
        component.disableAnimation = true;

        expect(component.animationState).toBeUndefined();
        component.open();
        expect(component.animationState).toBeUndefined();
    });

    it('should not trigger animation on Close if disableAnimation is true', async(() => {
        component.disableAnimation = true;
        component.closed.subscribe(actual => expect(actual).toBeUndefined());

        component.close();
        expect(component.isOpened).toBeFalsy();
        expect(component.animationState).toBeUndefined();
        expect(component.activeTimeUnit).toBe(TimeUnit.HOUR);
    }));

    describe('Timepicker subscriptions', () => {
        const hour = {time: 11, angle: 360};
        const minute = {time: 44, angle: 36};

        beforeEach(() => {
            component.ngOnInit(); // subscribe to hour, minute and period
        });

        afterEach(() => {
            component.ngOnDestroy(); // unsubscribe from all
        });

        it('should change hour on onHourChange', () => {
            component.onHourChange(hour);
            expect(component.selectedHour).toEqual(hour);
        });

        it('should change minute on onMinuteChange', () => {

            component.onMinuteChange(minute);
            expect(component.selectedMinute).toEqual(minute);
        });

        it('should change minute on changePeriod', () => {
            component.changePeriod(TimePeriod.PM);
            expect(component.selectedPeriod).toBe(TimePeriod.PM);
        });

        it('should not change hour, minute, period if unsubscribe', () => {
            component.ngOnDestroy();

            component.onHourChange(hour);
            component.onMinuteChange(minute);
            component.changePeriod(TimePeriod.PM);

            expect(component.selectedHour).not.toEqual(hour);
            expect(component.selectedMinute).not.toEqual(minute);
            expect(component.selectedPeriod).not.toBe(TimePeriod.PM);
        });
    });
});

export const spyOnFunction = <T>(obj: T, func: keyof T) => {
    const spy = jasmine.createSpy(func as string);
    spyOnProperty(obj, func, 'get').and.returnValue(spy);
    return spy;
};
